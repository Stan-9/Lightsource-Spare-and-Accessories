/**
 * Pure Utility and Derive Functions for Procurement Module
 *
 * Principles:
 * - One dataset, pure derived views.
 * - No side effects, safe to call inside render paths and transactions.
 * - All dates compared as YYYY-MM-DD calendar strings (Africa/Nairobi).
 */

/**
 * Checks if a product is sellable on storefront, catalog, checkout, or in-shop.
 * Gated by valid selling price (> 0) and visibility flag.
 *
 * @param {object|null} product
 * @returns {boolean}
 */
export const isProductSellable = (product) => {
  if (!product) return false;
  const price = Number(product.price || 0);
  return Boolean(price > 0 && product.isVisible !== false);
};

/**
 * Computes the outstanding quantity for a purchase line.
 * outstanding = qtyOrdered - qtyCancelled - qtyReceived
 *
 * @param {object} line
 * @returns {number}
 */
export const getLineOutstanding = (line) => {
  if (!line) return 0;
  const ordered   = Number(line.qtyOrdered || 0);
  const cancelled = Number(line.qtyCancelled || 0);
  const received  = Number(line.qtyReceived || 0);
  return Math.max(0, ordered - cancelled - received);
};

/**
 * Derives a line's status according to strict precedence rules:
 * 1. `cancelled`: qtyCancelled >= qtyOrdered
 * 2. `received`: outstanding === 0
 * 3. `in_transit`: outstanding > 0 and assigned to a shipment without a posted receipt
 * 4. `short`: outstanding > 0 and (shipment has posted receipt OR no shipment & qtyReceived > 0)
 * 5. `awaiting_dispatch`: anything else with outstanding > 0 (no shipment, nothing received)
 *
 * @param {object} line
 * @param {object|null} [shipment]
 * @returns {'cancelled'|'received'|'in_transit'|'short'|'awaiting_dispatch'}
 */
export const deriveLineStatus = (line, shipment = null) => {
  if (!line) return 'awaiting_dispatch';
  const ordered   = Number(line.qtyOrdered || 0);
  const cancelled = Number(line.qtyCancelled || 0);
  const received  = Number(line.qtyReceived || 0);

  if (cancelled >= ordered && ordered > 0) {
    return 'cancelled';
  }

  const outstanding = getLineOutstanding(line);
  if (outstanding === 0) {
    return 'received';
  }

  const hasShipment = Boolean(line.shipmentId || (shipment && shipment.id));
  const shipmentReceived = shipment?.status === 'received';

  if (hasShipment && !shipmentReceived) {
    return 'in_transit';
  }

  if ((hasShipment && shipmentReceived) || (!hasShipment && received > 0)) {
    return 'short';
  }

  return 'awaiting_dispatch';
};

/**
 * Checks if a line is overdue based on Nairobi calendar date comparison.
 *
 * @param {object} line
 * @param {object|null} po
 * @param {object|null} shipment
 * @param {string} [todayStr] - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export const isLineOverdue = (line, po = null, shipment = null, todayStr = null) => {
  const today = todayStr || new Date().toISOString().slice(0, 10);
  const status = deriveLineStatus(line, shipment);

  if (status === 'in_transit' && shipment?.etaCurrent) {
    return today > shipment.etaCurrent;
  }

  if (status === 'awaiting_dispatch' && po?.expectedDispatchDate) {
    return today > po.expectedDispatchDate;
  }

  return false;
};

/**
 * Checks if a shipment is overdue.
 *
 * @param {object} shipment
 * @param {string} [todayStr]
 * @returns {boolean}
 */
export const isShipmentOverdue = (shipment, todayStr = null) => {
  if (!shipment || shipment.status === 'received' || shipment.status === 'cancelled') {
    return false;
  }
  const today = todayStr || new Date().toISOString().slice(0, 10);
  return Boolean(shipment.etaCurrent && today > shipment.etaCurrent);
};

/**
 * Checks if a shipment is delayed (overdue OR current ETA later than original ETA).
 *
 * @param {object} shipment
 * @param {string} [todayStr]
 * @returns {boolean}
 */
export const isShipmentDelayed = (shipment, todayStr = null) => {
  if (!shipment) return false;
  if (isShipmentOverdue(shipment, todayStr)) return true;
  if (shipment.etaCurrent && shipment.etaOriginal) {
    return shipment.etaCurrent > shipment.etaOriginal;
  }
  return false;
};

/**
 * Derives PO payment status from net payments (payments - refunds) against totalCost.
 *
 * @param {object} po
 * @returns {{ paymentStatus: 'unpaid'|'partial'|'paid', totalCost: number, totalPaid: number, balanceRemaining: number }}
 */
export const derivePoPaymentStatus = (po) => {
  if (!po) {
    return { paymentStatus: 'unpaid', totalCost: 0, totalPaid: 0, balanceRemaining: 0 };
  }

  const totalCost = Number(po.totalCost || 0);
  const payments = po.payments || [];
  
  const netPaid = payments.reduce((sum, p) => {
    const amt = Number(p.amount || 0);
    return p.type === 'refund' ? sum - amt : sum + amt;
  }, 0);

  const totalPaid = Math.max(0, netPaid);
  const balanceRemaining = Math.max(0, totalCost - totalPaid);

  let paymentStatus = 'unpaid';
  if (totalCost > 0) {
    if (balanceRemaining === 0) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    }
  }

  return { paymentStatus, totalCost, totalPaid, balanceRemaining };
};

/**
 * Calculates freight allocation across receipt lines.
 *
 * Rule (§5.5):
 * - Allocates cargo cost proportionally by 'value' (qtyGood * unitCostKES) or 'quantity' (qtyGood).
 * - Rounds allocations to 2 decimal places.
 * - Puts rounding remainder on the largest line so allocations sum EXACTLY to cargoCostKES.
 *
 * @param {Array<{ id: string, qtyGood: number, unitCostKES: number }>} lines
 * @param {number} cargoCostKES
 * @param {'value'|'quantity'} [basis='value']
 * @returns {Map<string, { freightAllocKES: number, landedUnitCostKES: number }>}
 */
export const calculateFreightAllocation = (lines = [], cargoCostKES = 0, basis = 'value') => {
  const result = new Map();
  const validCost = Math.max(0, Number(cargoCostKES || 0));

  if (!lines || lines.length === 0) {
    return result;
  }

  const activeLines = lines.filter(l => Number(l.qtyGood || 0) > 0);

  if (activeLines.length === 0 || validCost === 0) {
    lines.forEach(line => {
      const unitCost = Number(line.unitCostKES || 0);
      result.set(line.id, { freightAllocKES: 0, landedUnitCostKES: unitCost });
    });
    return result;
  }

  // Compute weights
  const weights = activeLines.map(line => {
    const qty = Number(line.qtyGood || 0);
    const unitCost = Number(line.unitCostKES || 0);
    const weight = basis === 'quantity' ? qty : qty * unitCost;
    return { line, qty, unitCost, weight };
  });

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  // Fallback to quantity weighting if total weight by value is 0
  const finalTotalWeight = totalWeight > 0 ? totalWeight : weights.reduce((sum, w) => sum + w.qty, 0);

  let sumAllocated = 0;
  let largestIndex = 0;
  let maxWeight = -1;

  const rawAllocations = weights.map((w, idx) => {
    const weightProp = finalTotalWeight > 0 ? (finalTotalWeight === totalWeight ? w.weight : w.qty) / finalTotalWeight : 0;
    const rawAlloc = Math.round(validCost * weightProp * 100) / 100;
    sumAllocated += rawAlloc;

    if (w.weight > maxWeight) {
      maxWeight = w.weight;
      largestIndex = idx;
    }

    return { ...w, alloc: rawAlloc };
  });

  // Adjust rounding remainder on largest line
  const remainder = Math.round((validCost - sumAllocated) * 100) / 100;
  if (remainder !== 0 && rawAllocations[largestIndex]) {
    rawAllocations[largestIndex].alloc = Math.round((rawAllocations[largestIndex].alloc + remainder) * 100) / 100;
  }

  // Populate result map
  lines.forEach(line => {
    const match = rawAllocations.find(r => r.line.id === line.id);
    if (match && match.qty > 0) {
      const alloc = match.alloc;
      const landed = Math.round((match.unitCost + alloc / match.qty) * 100) / 100;
      result.set(line.id, { freightAllocKES: alloc, landedUnitCostKES: landed });
    } else {
      const unitCost = Number(line.unitCostKES || 0);
      result.set(line.id, { freightAllocKES: 0, landedUnitCostKES: unitCost });
    }
  });

  return result;
};

/**
 * Computes new weighted average cost for a product.
 * newCost = (max(onHand,0) * costBefore + qtyGood * landed) / (max(onHand,0) + qtyGood)
 *
 * @param {number} onHandStock
 * @param {number} costBefore
 * @param {number} qtyReceived
 * @param {number} landedUnitCostKES
 * @returns {number}
 */
export const computeWeightedAverageCost = (onHandStock, costBefore, qtyReceived, landedUnitCostKES) => {
  const qty = Math.max(0, Number(qtyReceived || 0));
  const landed = Math.max(0, Number(landedUnitCostKES || 0));
  const prevCost = Math.max(0, Number(costBefore || 0));
  const validOnHand = Math.max(0, Number(onHandStock || 0));

  if (qty === 0) return prevCost;
  if (validOnHand === 0 || prevCost === 0) {
    return Math.round(landed * 100) / 100;
  }

  const totalVal = (validOnHand * prevCost) + (qty * landed);
  const totalQty = validOnHand + qty;
  return Math.round((totalVal / totalQty) * 100) / 100;
};

/**
 * Computes total value of goods arriving in KES.
 * Sum of (outstanding * unitCostKES).
 *
 * @param {Array<{ qtyOrdered: number, qtyCancelled: number, qtyReceived: number, unitCostKES: number }>} lines
 * @returns {number}
 */
export const calculateWorthOfArrivals = (lines = []) => {
  if (!lines || lines.length === 0) return 0;
  const total = lines.reduce((sum, line) => {
    const outstanding = getLineOutstanding(line);
    const unitCost = Number(line.unitCostKES || line.unitCost || 0);
    return sum + (outstanding * unitCost);
  }, 0);
  return Math.round(total * 100) / 100;
};
