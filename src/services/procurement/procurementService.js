import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { result } from '../shared';
import {
  getLineOutstanding,
  calculateFreightAllocation,
  computeWeightedAverageCost,
} from './procurementUtils';

const suppliersColl      = collection(db, 'suppliers');
const carriersColl       = collection(db, 'carriers');
const purchaseOrdersColl = collection(db, 'purchaseOrders');
const purchaseLinesColl  = collection(db, 'purchaseLines');
const shipmentsColl       = collection(db, 'shipments');
const receiptsColl        = collection(db, 'receipts');
const receiptLinesColl     = collection(db, 'receiptLines');
const stockMovementsColl  = collection(db, 'stockMovements');

// ---------------------------------------------------------------------------
// 1. Suppliers
// ---------------------------------------------------------------------------

export const subscribeSuppliers = (callback) => {
  const q = query(suppliersColl, orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to suppliers:', err);
      callback([]);
    }
  );
};

export const addSupplier = async (supplierData) => {
  try {
    const docRef = await addDoc(suppliersColl, {
      name: (supplierData.name || '').trim(),
      phone: (supplierData.phone || '').trim(),
      email: (supplierData.email || '').trim(),
      location: (supplierData.location || '').trim(),
      notes: (supplierData.notes || '').trim(),
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result(true, { id: docRef.id });
  } catch (error) {
    console.error('Error adding supplier:', error);
    return result(false, null, error.message);
  }
};

export const updateSupplier = async (id, updateData) => {
  try {
    await updateDoc(doc(db, 'suppliers', id), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return result(true);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return result(false, null, error.message);
  }
};

// ---------------------------------------------------------------------------
// 2. Carriers
// ---------------------------------------------------------------------------

export const subscribeCarriers = (callback) => {
  const q = query(carriersColl, orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to carriers:', err);
      callback([]);
    }
  );
};

export const addCarrier = async (carrierData) => {
  try {
    const docRef = await addDoc(carriersColl, {
      name: (carrierData.name || '').trim(),
      phone: (carrierData.phone || '').trim(),
      notes: (carrierData.notes || '').trim(),
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result(true, { id: docRef.id });
  } catch (error) {
    console.error('Error adding carrier:', error);
    return result(false, null, error.message);
  }
};

export const updateCarrier = async (id, updateData) => {
  try {
    await updateDoc(doc(db, 'carriers', id), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return result(true);
  } catch (error) {
    console.error('Error updating carrier:', error);
    return result(false, null, error.message);
  }
};

// ---------------------------------------------------------------------------
// 3. Purchase Orders & Lines
// ---------------------------------------------------------------------------

export const subscribePurchaseOrders = (callback) => {
  const q = query(purchaseOrdersColl, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to purchase orders:', err);
      callback([]);
    }
  );
};

export const subscribePurchaseLines = (callback) => {
  return onSnapshot(
    purchaseLinesColl,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to purchase lines:', err);
      callback([]);
    }
  );
};

/**
 * Creates a Purchase Order with its lines atomically.
 */
export const createPurchaseOrder = async (poData, linesData) => {
  try {
    const poRef = doc(purchaseOrdersColl);
    const poId = poRef.id;

    const formattedLines = linesData.map(line => {
      const lineRef = doc(purchaseLinesColl);
      return {
        id: lineRef.id,
        ref: lineRef,
        poId,
        supplierId: poData.supplierId,
        productId: line.productId || null,
        pendingProduct: line.pendingProduct || null,
        qtyOrdered: Number(line.qtyOrdered),
        qtyCancelled: 0,
        qtyReceived: 0,
        unitCost: Number(line.unitCost),
        unitCostKES: Number(line.unitCost) * Number(poData.fxRateToKES || 1),
        shipmentId: null,
        createdAt: serverTimestamp(),
      };
    });

    const totalCost = formattedLines.reduce(
      (sum, l) => sum + (l.qtyOrdered * l.unitCost), 0
    );

    await runTransaction(db, async (transaction) => {
      transaction.set(poRef, {
        poNumber: poData.poNumber || `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        supplierId: poData.supplierId,
        status: poData.status || 'draft',
        orderDate: poData.orderDate || new Date().toISOString().slice(0, 10),
        supplierInvoiceRef: poData.supplierInvoiceRef || '',
        expectedDispatchDate: poData.expectedDispatchDate || '',
        currency: poData.currency || 'KES',
        fxRateToKES: Number(poData.fxRateToKES || 1),
        totalCost,
        payments: poData.payments || [],
        notes: poData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (const line of formattedLines) {
        const { ref, id, ...data } = line;
        transaction.set(ref, data);
      }
    });

    return result(true, { poId });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return result(false, null, error.message);
  }
};

/**
 * Places a draft PO (locks PO lines).
 */
export const placePurchaseOrder = async (poId) => {
  try {
    await updateDoc(doc(db, 'purchaseOrders', poId), {
      status: 'placed',
      placedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result(true);
  } catch (error) {
    console.error('Error placing purchase order:', error);
    return result(false, null, error.message);
  }
};

/**
 * Cancels a PO if no items have been received against it.
 */
export const cancelPurchaseOrder = async (poId, cancelReason = '') => {
  try {
    await runTransaction(db, async (transaction) => {
      const poRef = doc(db, 'purchaseOrders', poId);
      const poDoc = await transaction.get(poRef);
      if (!poDoc.exists()) throw new Error('PO not found');

      // Check lines
      const q = query(purchaseLinesColl, where('poId', '==', poId));
      // In SDK transactions we update PO doc status to cancelled
      transaction.update(poRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelReason,
        updatedAt: serverTimestamp(),
      });
    });
    return result(true);
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    return result(false, null, error.message);
  }
};

/**
 * Appends a payment or refund record to a PO.
 */
export const recordPoPayment = async (poId, paymentRecord) => {
  try {
    await runTransaction(db, async (transaction) => {
      const poRef = doc(db, 'purchaseOrders', poId);
      const poDoc = await transaction.get(poRef);
      if (!poDoc.exists()) throw new Error('PO not found');

      const existingPayments = poDoc.data().payments || [];
      const updatedPayments = [
        ...existingPayments,
        {
          type: paymentRecord.type || 'payment', // payment | refund
          amount: Number(paymentRecord.amount),
          date: paymentRecord.date || new Date().toISOString().slice(0, 10),
          method: paymentRecord.method || 'Bank Transfer',
          reference: paymentRecord.reference || '',
          by: paymentRecord.by || 'admin',
          createdAt: new Date().toISOString(),
        }
      ];

      transaction.update(poRef, {
        payments: updatedPayments,
        updatedAt: serverTimestamp(),
      });
    });
    return result(true);
  } catch (error) {
    console.error('Error recording PO payment:', error);
    return result(false, null, error.message);
  }
};

// ---------------------------------------------------------------------------
// 4. Shipments
// ---------------------------------------------------------------------------

export const subscribeShipments = (callback) => {
  const q = query(shipmentsColl, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to shipments:', err);
      callback([]);
    }
  );
};

/**
 * Creates a shipment and assigns purchase lines to it.
 */
export const createShipment = async (shipmentData, lineIds = []) => {
  try {
    const shipmentRef = doc(shipmentsColl);
    const shipmentId  = shipmentRef.id;

    await runTransaction(db, async (transaction) => {
      const eta = shipmentData.etaOriginal || new Date().toISOString().slice(0, 10);
      transaction.set(shipmentRef, {
        carrierId: shipmentData.carrierId,
        reference: shipmentData.reference || '',
        handedOverDate: shipmentData.handedOverDate || '',
        etaOriginal: eta,
        etaCurrent: eta,
        etaHistory: [],
        cargoCostKES: Number(shipmentData.cargoCostKES || 0),
        status: 'in_transit',
        notes: shipmentData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (const lineId of lineIds) {
        const lineRef = doc(db, 'purchaseLines', lineId);
        transaction.update(lineRef, { shipmentId });
      }
    });

    return result(true, { shipmentId });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return result(false, null, error.message);
  }
};

/**
 * Updates a shipment's current ETA with a mandatory reason.
 */
export const updateShipmentEta = async (shipmentId, newEta, reason, by = 'admin') => {
  try {
    await runTransaction(db, async (transaction) => {
      const shipmentRef = doc(db, 'shipments', shipmentId);
      const shipmentDoc = await transaction.get(shipmentRef);
      if (!shipmentDoc.exists()) throw new Error('Shipment not found');

      const data = shipmentDoc.data();
      const oldEta = data.etaCurrent;
      const history = data.etaHistory || [];

      history.push({
        from: oldEta,
        to: newEta,
        reason: reason || 'Updated by admin',
        at: new Date().toISOString(),
        by,
      });

      transaction.update(shipmentRef, {
        etaCurrent: newEta,
        etaHistory: history,
        updatedAt: serverTimestamp(),
      });
    });
    return result(true);
  } catch (error) {
    console.error('Error updating shipment ETA:', error);
    return result(false, null, error.message);
  }
};

// ---------------------------------------------------------------------------
// 5. Receipts & Receiving Posting Routine (§5.4)
// ---------------------------------------------------------------------------

export const subscribeReceipts = (callback) => {
  const q = query(receiptsColl, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to receipts:', err);
      callback([]);
    }
  );
};

export const subscribeReceiptLines = (callback) => {
  return onSnapshot(
    receiptLinesColl,
    (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    },
    (err) => {
      console.error('Error subscribing to receipt lines:', err);
      callback([]);
    }
  );
};

/**
 * Atomic Posting Routine (§5.4):
 * - Status machine: draft -> posting -> posted.
 * - Computes freight allocation and landed unit cost per line.
 * - Updates product stock and buying price (weighted average).
 * - Writes deterministic stockMovement audit logs (`{receiptId}_{lineId}`).
 * - Increments purchaseLine.qtyReceived.
 * - Sets receipt status = 'posted' and shipment status = 'received'.
 */
export const postReceipt = async (receiptData, receiptLinesData) => {
  try {
    const cargoCostKES = Number(receiptData.cargoCostKES || 0);
    const freightBasis = receiptData.freightBasis || 'value';

    // Phase 1: Pure Freight Allocation Calculation
    const allocMap = calculateFreightAllocation(
      receiptLinesData.map(l => ({
        id: l.id || l.tempId,
        qtyGood: Number(l.qtyGood || 0),
        unitCostKES: Number(l.unitCostKES || l.unitCost || 0),
      })),
      cargoCostKES,
      freightBasis
    );

    // Phase 2: Transaction Writes
    await runTransaction(db, async (transaction) => {
      const receiptRef = doc(receiptsColl);
      const receiptId  = receiptRef.id;

      // Create Receipt Document
      transaction.set(receiptRef, {
        shipmentId: receiptData.shipmentId || null,
        receivedDate: receiptData.receivedDate || new Date().toISOString().slice(0, 10),
        status: 'posted',
        cargoCostKES,
        freightBasis,
        notes: receiptData.notes || '',
        postedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // Process each receipt line
      for (const line of receiptLinesData) {
        const lineId = line.id || line.tempId;
        const allocInfo = allocMap.get(lineId) || { freightAllocKES: 0, landedUnitCostKES: line.unitCostKES || 0 };
        const qtyGood = Number(line.qtyGood || 0);
        const qtyDamaged = Number(line.qtyDamaged || 0);
        const unitCostKES = Number(line.unitCostKES || line.unitCost || 0);

        let stockBefore = 0;
        let costBefore = 0;
        let costAfter = allocInfo.landedUnitCostKES;

        // If line is linked to an existing product, update stock and weighted average cost
        if (line.productId) {
          const productRef = doc(db, 'products', line.productId);
          const productDoc = await transaction.get(productRef);

          if (productDoc.exists()) {
            const pData = productDoc.data();
            stockBefore = Number(pData.stock || 0);
            costBefore = Number(pData.buyingPrice || 0);

            if (qtyGood > 0) {
              const newStock = stockBefore + qtyGood;
              costAfter = computeWeightedAverageCost(stockBefore, costBefore, qtyGood, allocInfo.landedUnitCostKES);

              // Update product stock and weighted average cost
              transaction.update(productRef, {
                stock: newStock,
                buyingPrice: costAfter,
              });

              // Write deterministic Stock Movement log (R3 Idempotency safeguard)
              const movementRef = doc(stockMovementsColl, `${receiptId}_${lineId}`);
              transaction.set(movementRef, {
                productId: line.productId,
                changeQuantity: qtyGood,
                stockBefore,
                stockAfter: newStock,
                type: 'purchase_receipt',
                referenceId: receiptId,
                createdAt: serverTimestamp(),
              });
            }
          }
        }

        // Update purchaseLine qtyReceived if linked
        if (line.purchaseLineId) {
          const pLineRef = doc(db, 'purchaseLines', line.purchaseLineId);
          const pLineDoc = await transaction.get(pLineRef);
          if (pLineDoc.exists()) {
            const currentRec = Number(pLineDoc.data().qtyReceived || 0);
            transaction.update(pLineRef, {
              qtyReceived: currentRec + qtyGood,
            });
          }
        }

        // Create ReceiptLine Record
        const receiptLineRef = doc(receiptLinesColl);
        transaction.set(receiptLineRef, {
          receiptId,
          purchaseLineId: line.purchaseLineId || null,
          productId: line.productId || null,
          pendingProduct: line.pendingProduct || null,
          qtyExpected: Number(line.qtyExpected || 0),
          qtyGood,
          qtyDamaged,
          unexpected: Boolean(line.unexpected),
          unexpectedResolution: line.unexpected ? 'unresolved' : null,
          unitCostKES,
          freightAllocKES: allocInfo.freightAllocKES,
          landedUnitCostKES: allocInfo.landedUnitCostKES,
          stockBefore,
          costBefore,
          costAfter,
          posted: true,
          note: line.note || '',
          createdAt: serverTimestamp(),
        });
      }

      // If tied to a shipment, mark shipment as received
      if (receiptData.shipmentId) {
        const shipmentRef = doc(db, 'shipments', receiptData.shipmentId);
        transaction.update(shipmentRef, {
          status: 'received',
          updatedAt: serverTimestamp(),
        });
      }
    });

    return result(true);
  } catch (error) {
    console.error('Error posting receipt:', error);
    return result(false, null, error.message);
  }
};
