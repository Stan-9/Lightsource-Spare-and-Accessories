import { describe, it, expect } from 'vitest';
import {
  isProductSellable,
  getLineOutstanding,
  deriveLineStatus,
  isLineOverdue,
  isShipmentOverdue,
  isShipmentDelayed,
  derivePoPaymentStatus,
  calculateFreightAllocation,
  computeWeightedAverageCost,
  calculateWorthOfArrivals,
} from './procurementUtils';

describe('Procurement Pure Derive Functions', () => {

  describe('isProductSellable', () => {
    it('returns false for null/undefined products', () => {
      expect(isProductSellable(null)).toBe(false);
      expect(isProductSellable(undefined)).toBe(false);
    });

    it('returns false for unpriced products (price <= 0)', () => {
      expect(isProductSellable({ price: 0, isVisible: true })).toBe(false);
      expect(isProductSellable({ price: -10, isVisible: true })).toBe(false);
    });

    it('returns false for hidden products (isVisible === false)', () => {
      expect(isProductSellable({ price: 500, isVisible: false })).toBe(false);
    });

    it('returns true for priced, visible products', () => {
      expect(isProductSellable({ price: 1500, isVisible: true })).toBe(true);
      expect(isProductSellable({ price: 1500 })).toBe(true); // default visible
    });
  });

  describe('deriveLineStatus Precedence Rules', () => {
    it('1. returns cancelled when qtyCancelled >= qtyOrdered', () => {
      const line = { qtyOrdered: 10, qtyCancelled: 10, qtyReceived: 0 };
      expect(deriveLineStatus(line)).toBe('cancelled');
    });

    it('2. returns received when outstanding is 0', () => {
      const line = { qtyOrdered: 10, qtyCancelled: 2, qtyReceived: 8 };
      expect(deriveLineStatus(line)).toBe('received');
    });

    it('3. returns in_transit when outstanding > 0 and assigned to active shipment', () => {
      const line = { qtyOrdered: 10, qtyCancelled: 0, qtyReceived: 0, shipmentId: 'shp1' };
      const shipment = { id: 'shp1', status: 'in_transit' };
      expect(deriveLineStatus(line, shipment)).toBe('in_transit');
    });

    it('4. returns short when outstanding > 0 and shipment received or partial received without shipment', () => {
      const lineShortShipment = { qtyOrdered: 10, qtyCancelled: 0, qtyReceived: 4, shipmentId: 'shp1' };
      const shipmentReceived = { id: 'shp1', status: 'received' };
      expect(deriveLineStatus(lineShortShipment, shipmentReceived)).toBe('short');

      const lineDirectShort = { qtyOrdered: 10, qtyCancelled: 0, qtyReceived: 4 };
      expect(deriveLineStatus(lineDirectShort)).toBe('short');
    });

    it('5. returns awaiting_dispatch for unassigned, unreceived lines', () => {
      const line = { qtyOrdered: 10, qtyCancelled: 0, qtyReceived: 0 };
      expect(deriveLineStatus(line)).toBe('awaiting_dispatch');
    });
  });

  describe('Overdue and Delayed Rules', () => {
    it('detects line overdue against shipment ETA or PO expected dispatch date', () => {
      const today = '2026-09-29';

      const lineInTransit = { qtyOrdered: 10, qtyReceived: 0, shipmentId: 's1' };
      const shipmentOverdue = { id: 's1', status: 'in_transit', etaCurrent: '2026-09-25' };
      const shipmentFuture = { id: 's1', status: 'in_transit', etaCurrent: '2026-10-05' };

      expect(isLineOverdue(lineInTransit, null, shipmentOverdue, today)).toBe(true);
      expect(isLineOverdue(lineInTransit, null, shipmentFuture, today)).toBe(false);

      const lineAwaiting = { qtyOrdered: 10, qtyReceived: 0 };
      const poOverdue = { expectedDispatchDate: '2026-09-20' };
      expect(isLineOverdue(lineAwaiting, poOverdue, null, today)).toBe(true);
    });

    it('detects shipment delay and overdue correctly', () => {
      const today = '2026-09-29';
      const shipmentOverdue = { status: 'in_transit', etaCurrent: '2026-09-25', etaOriginal: '2026-09-25' };
      const shipmentPushed = { status: 'in_transit', etaCurrent: '2026-10-10', etaOriginal: '2026-10-01' };
      const shipmentOnTime = { status: 'in_transit', etaCurrent: '2026-10-10', etaOriginal: '2026-10-10' };

      expect(isShipmentOverdue(shipmentOverdue, today)).toBe(true);
      expect(isShipmentDelayed(shipmentOverdue, today)).toBe(true);
      expect(isShipmentDelayed(shipmentPushed, today)).toBe(true);
      expect(isShipmentDelayed(shipmentOnTime, today)).toBe(false);
    });
  });

  describe('derivePoPaymentStatus', () => {
    it('calculates unpaid, partial, and paid states', () => {
      const poUnpaid = { totalCost: 1000, payments: [] };
      expect(derivePoPaymentStatus(poUnpaid)).toEqual({
        paymentStatus: 'unpaid',
        totalCost: 1000,
        totalPaid: 0,
        balanceRemaining: 1000,
      });

      const poPartial = {
        totalCost: 1000,
        payments: [{ type: 'payment', amount: 400 }]
      };
      expect(derivePoPaymentStatus(poPartial)).toEqual({
        paymentStatus: 'partial',
        totalCost: 1000,
        totalPaid: 400,
        balanceRemaining: 600,
      });

      const poPaid = {
        totalCost: 1000,
        payments: [
          { type: 'payment', amount: 800 },
          { type: 'payment', amount: 200 }
        ]
      };
      expect(derivePoPaymentStatus(poPaid)).toEqual({
        paymentStatus: 'paid',
        totalCost: 1000,
        totalPaid: 1000,
        balanceRemaining: 0,
      });

      const poRefund = {
        totalCost: 1000,
        payments: [
          { type: 'payment', amount: 1000 },
          { type: 'refund', amount: 200 }
        ]
      };
      expect(derivePoPaymentStatus(poRefund)).toEqual({
        paymentStatus: 'partial',
        totalCost: 1000,
        totalPaid: 800,
        balanceRemaining: 200,
      });
    });
  });

  describe('Freight Allocation (R11 Safeguard)', () => {
    it('allocates freight by value and ensures exact sum of allocations equals cargoCostKES', () => {
      const lines = [
        { id: 'l1', qtyGood: 10, unitCostKES: 100 }, // value 1000
        { id: 'l2', qtyGood: 5,  unitCostKES: 200 }, // value 1000
        { id: 'l3', qtyGood: 2,  unitCostKES: 500 }, // value 1000
      ];
      const cargoCostKES = 1000;
      const allocMap = calculateFreightAllocation(lines, cargoCostKES, 'value');

      let totalAlloc = 0;
      allocMap.forEach((val) => {
        totalAlloc += val.freightAllocKES;
      });

      expect(totalAlloc).toBe(1000);
      expect(allocMap.get('l1').landedUnitCostKES).toBe(133.33); // 100 + (333.34/10)
    });

    it('allocates freight by quantity when specified', () => {
      const lines = [
        { id: 'l1', qtyGood: 8, unitCostKES: 50 },
        { id: 'l2', qtyGood: 2, unitCostKES: 500 },
      ];
      const cargoCostKES = 100;
      const allocMap = calculateFreightAllocation(lines, cargoCostKES, 'quantity');

      expect(allocMap.get('l1').freightAllocKES).toBe(80);
      expect(allocMap.get('l2').freightAllocKES).toBe(20);
    });
  });

  describe('computeWeightedAverageCost', () => {
    it('correctly calculates weighted average landed cost', () => {
      // 10 on hand at 100, receive 40 at 130 landed -> (1000 + 5200)/50 = 124
      const newCost = computeWeightedAverageCost(10, 100, 40, 130);
      expect(newCost).toBe(124);
    });

    it('falls back to landed cost when on-hand stock is 0 or costBefore is 0', () => {
      expect(computeWeightedAverageCost(0, 100, 10, 150)).toBe(150);
      expect(computeWeightedAverageCost(10, 0, 10, 150)).toBe(150);
    });
  });

  describe('calculateWorthOfArrivals', () => {
    it('sums outstanding value correctly', () => {
      const lines = [
        { qtyOrdered: 10, qtyCancelled: 0, qtyReceived: 2, unitCostKES: 500 }, // 8 * 500 = 4000
        { qtyOrdered: 5,  qtyCancelled: 1, qtyReceived: 4, unitCostKES: 200 }, // 0 * 200 = 0
      ];
      expect(calculateWorthOfArrivals(lines)).toBe(4000);
    });
  });
});
