import { describe, it, expect, vi } from 'vitest';
import { normalizeOrder, getOrderStatus } from './sales';

describe('Order Workflow & Schema Tests', () => {
  describe('Legacy Document Migration Mapping', () => {
    it('maps legacy completed orders to fulfilled + paid', () => {
      const legacyDoc = { status: 'completed', paymentType: 'Cash' };
      const norm = normalizeOrder(legacyDoc);
      expect(norm.fulfillmentStatus).toBe('fulfilled');
      expect(norm.paymentStatus).toBe('paid');
      expect(norm.isCredit).toBe(false);
      expect(getOrderStatus(norm)).toBe('completed');
    });

    it('maps legacy cancelled orders to not_fulfilled + unpaid', () => {
      const legacyDoc = { status: 'cancelled', paymentType: 'Cash' };
      const norm = normalizeOrder(legacyDoc);
      expect(norm.fulfillmentStatus).toBe('not_fulfilled');
      expect(norm.paymentStatus).toBe('unpaid');
      expect(norm.isCredit).toBe(false);
      expect(getOrderStatus(norm)).toBe('cancelled');
    });

    it('maps legacy pending credit orders to fulfilled + unpaid + isCredit=true', () => {
      const legacyDoc = { status: 'pending', paymentType: 'Credit', paymentStatus: 'Unpaid' };
      const norm = normalizeOrder(legacyDoc);
      expect(norm.fulfillmentStatus).toBe('fulfilled');
      expect(norm.paymentStatus).toBe('unpaid');
      expect(norm.isCredit).toBe(true);
      expect(getOrderStatus(norm)).toBe('pending');
    });

    it('maps legacy pending online orders to fulfilled + unpaid + isCredit=false', () => {
      const legacyDoc = { status: 'pending', paymentType: 'Cash', customerAction: 'online_order' };
      const norm = normalizeOrder(legacyDoc);
      expect(norm.fulfillmentStatus).toBe('fulfilled');
      expect(norm.paymentStatus).toBe('unpaid');
      expect(norm.isCredit).toBe(false);
      expect(getOrderStatus(norm)).toBe('pending');
    });

    it('maps legacy pending whatsapp orders to not_fulfilled + unpaid + isCredit=false', () => {
      const legacyDoc = { status: 'pending', customerAction: 'whatsapp_redirect' };
      const norm = normalizeOrder(legacyDoc);
      expect(norm.fulfillmentStatus).toBe('not_fulfilled');
      expect(norm.paymentStatus).toBe('unpaid');
      expect(norm.isCredit).toBe(false);
      expect(getOrderStatus(norm)).toBe('cancelled');
    });

    it('maps legacy pending missing customerAction & paymentType to fallback fulfilled + unpaid', () => {
      const legacyDoc = { status: 'pending' };
      const norm = normalizeOrder(legacyDoc);
      expect(norm.fulfillmentStatus).toBe('fulfilled');
      expect(norm.paymentStatus).toBe('unpaid');
      expect(norm.isCredit).toBe(false);
      expect(getOrderStatus(norm)).toBe('pending');
    });
  });

  describe('Order State Transitions & Business Logic', () => {
    it('derived order status correctly maps 4 matrix combinations', () => {
      expect(getOrderStatus({ fulfillmentStatus: 'not_fulfilled', paymentStatus: 'unpaid' })).toBe('cancelled');
      expect(getOrderStatus({ fulfillmentStatus: 'fulfilled', paymentStatus: 'unpaid' })).toBe('pending');
      expect(getOrderStatus({ fulfillmentStatus: 'fulfilled', paymentStatus: 'paid' })).toBe('completed');
      expect(getOrderStatus({ fulfillmentStatus: 'returned', paymentStatus: 'unpaid' })).toBe('cancelled');
      expect(getOrderStatus({ fulfillmentStatus: 'returned', paymentStatus: 'paid' })).toBe('cancelled');
    });

    it('returns on credit sale preserves isCredit=true while voiding debt', () => {
      const creditOrder = {
        fulfillmentStatus: 'returned',
        isCredit: true,
        paymentStatus: 'unpaid',
        balanceRemaining: 0
      };
      const norm = normalizeOrder(creditOrder);
      expect(norm.isCredit).toBe(true);
      expect(norm.fulfillmentStatus).toBe('returned');
      expect(norm.balanceRemaining).toBe(0);
    });
  });
});
