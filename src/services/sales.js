import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { result } from './shared';

const ordersCollection = collection(db, 'orders');

// ---------------------------------------------------------------------------
// Order normalisation
// ---------------------------------------------------------------------------

/**
 * Normalises an order document to the current schema, handling legacy records
 * that predate the `fulfillmentStatus` / `isCredit` fields.
 *
 * This function is pure and has no side effects — safe to call in render paths.
 *
 * @param {object|null} order - Raw Firestore order data (with `id` merged in).
 * @returns {object|null} Normalised order, or `null` if input is falsy.
 */
export const normalizeOrder = (order) => {
  if (!order) return order;

  // Modern documents already carry `fulfillmentStatus` — just normalise casing.
  if (order.fulfillmentStatus) {
    return {
      ...order,
      paymentStatus: order.paymentStatus === 'Paid' || order.paymentStatus === 'paid'
        ? 'paid'
        : 'unpaid',
      isCredit: Boolean(
        order.isCredit !== undefined ? order.isCredit : order.paymentType === 'Credit'
      ),
    };
  }

  // ── Legacy migration mapping ──────────────────────────────────────────────
  const oldStatus      = order.status     || 'pending';
  const paymentType    = order.paymentType || 'Cash';
  const customerAction = order.customerAction;

  let fulfillmentStatus = 'fulfilled';
  let paymentStatus     = order.paymentStatus === 'Paid' || order.paymentStatus === 'paid'
    ? 'paid'
    : 'unpaid';
  let isCredit          = paymentType === 'Credit';

  if (oldStatus === 'completed') {
    fulfillmentStatus = 'fulfilled';
    paymentStatus     = 'paid';
  } else if (oldStatus === 'cancelled') {
    fulfillmentStatus = 'not_fulfilled';
    paymentStatus     = 'unpaid';
  } else {
    // oldStatus === 'pending'
    if (paymentType === 'Credit') {
      fulfillmentStatus = 'fulfilled';
      paymentStatus     = 'unpaid';
      isCredit          = true;
    } else if (customerAction === 'online_order') {
      fulfillmentStatus = 'fulfilled';
      paymentStatus     = 'unpaid';
      isCredit          = false;
    } else if (customerAction === 'whatsapp_redirect') {
      fulfillmentStatus = 'not_fulfilled';
      paymentStatus     = 'unpaid';
      isCredit          = false;
    } else {
      fulfillmentStatus = 'fulfilled';
      paymentStatus     = 'unpaid';
      isCredit          = false;
    }
  }

  return { ...order, fulfillmentStatus, paymentStatus, isCredit };
};

/**
 * Derives a simple three-state status label from a normalised order.
 *
 * @param {object} order
 * @returns {'completed'|'cancelled'|'pending'}
 */
export const getOrderStatus = (order) => {
  const norm = normalizeOrder(order);
  if (norm.fulfillmentStatus === 'not_fulfilled' || norm.fulfillmentStatus === 'returned') {
    return 'cancelled';
  }
  if (norm.fulfillmentStatus === 'fulfilled') {
    return norm.paymentStatus === 'paid' ? 'completed' : 'pending';
  }
  return 'pending';
};

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

/**
 * Logs a lightweight order record without touching stock.
 * Used for WhatsApp-redirect orders that are not yet confirmed.
 *
 * @param {object} orderData
 */
export const logOrder = async (orderData) => {
  try {
    const itemsWithCost = (orderData.items || []).map((item) => {
      const price = Number(item.price || 0);
      return {
        id:                 item.id,
        name:               item.name,
        price,
        buyingPrice:        item.buyingPrice || 0,
        quantity:           item.quantity,
        original_price:     price,
        final_price:        price,
        discount_amount:    0,
        discount_percentage: 0,
        was_discounted:     false,
      };
    });

    const total = Number(orderData.total || 0);

    await addDoc(ordersCollection, {
      ...orderData,
      items:             itemsWithCost,
      subtotal_original: total,
      total_discount:    0,
      net_total:         total,
      flaggedForReview:  false,
      createdAt:         serverTimestamp(),
      status:            'pending',
      paymentType:       orderData.paymentType   || 'Cash',
      paymentStatus:     orderData.paymentStatus || 'Paid',
    });

    return result(true);
  } catch (error) {
    console.error('Error logging order:', error);
    return result(false, null, error.message);
  }
};

/**
 * Atomically deducts stock from each product and records the order in a single
 * Firestore transaction. Used for both walk-in POS sales and online checkout.
 *
 * @param {object} orderData
 */
export const executeTransaction = async (orderData) => {
  try {
    await runTransaction(db, async (transaction) => {
      // Phase 1 — all reads must come before any writes.
      const productDocs = [];
      for (const item of orderData.items) {
        const productRef = doc(db, 'products', item.id);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error(`Product "${item.name}" no longer exists in inventory.`);
        }
        productDocs.push({ ref: productRef, data: productDoc.data(), item });
      }

      // Phase 2 — compute derived values.
      const itemsWithCost = productDocs.map(({ data, item }) => {
        const originalPrice     = Number(data.price || 0);
        const finalPrice        = Number(item.price);
        const discountAmount    = Math.max(0, originalPrice - finalPrice);
        const discountPercentage = originalPrice > 0
          ? (discountAmount / originalPrice) * 100
          : 0;

        return {
          id:                  item.id,
          name:                item.name,
          price:               finalPrice,
          buyingPrice:         data.buyingPrice || 0,
          quantity:            item.quantity,
          original_price:      originalPrice,
          final_price:         finalPrice,
          discount_amount:     discountAmount,
          discount_percentage: discountPercentage,
          was_discounted:      discountAmount > 0,
        };
      });

      const subtotalOriginal = itemsWithCost.reduce(
        (sum, i) => sum + i.original_price * i.quantity, 0
      );
      const totalDiscount = itemsWithCost.reduce(
        (sum, i) => sum + i.discount_amount * i.quantity, 0
      );
      const netTotal        = itemsWithCost.reduce(
        (sum, i) => sum + i.final_price * i.quantity, 0
      );
      const flaggedForReview = itemsWithCost.some((i) => i.was_discounted);

      const paymentType   = orderData.paymentType || 'Cash';
      const isCredit      = Boolean(
        orderData.isCredit !== undefined
          ? orderData.isCredit
          : paymentType === 'Credit'
      );
      const rawStatus     = orderData.paymentStatus || (paymentType === 'Credit' ? 'Unpaid' : 'Paid');
      const normStatus    = rawStatus === 'Paid' || rawStatus === 'paid' ? 'paid' : 'unpaid';
      const amountPaid    = orderData.amountPaid !== undefined
        ? Number(orderData.amountPaid)
        : normStatus === 'paid' ? netTotal : 0;
      const balanceRemaining    = Math.max(0, netTotal - amountPaid);
      const finalPaymentStatus  = balanceRemaining === 0 ? 'paid' : 'unpaid';
      const fulfillmentStatus   = orderData.fulfillmentStatus || 'fulfilled';

      // Phase 3 — all writes.
      for (const { ref, data, item } of productDocs) {
        transaction.update(ref, { stock: Math.max(0, data.stock - item.quantity) });
      }

      const newOrderRef = doc(ordersCollection);
      transaction.set(newOrderRef, {
        ...orderData,
        items:             itemsWithCost,
        subtotal_original: subtotalOriginal,
        total_discount:    totalDiscount,
        net_total:         netTotal,
        flaggedForReview,
        createdAt:         serverTimestamp(),
        fulfillmentStatus,
        paymentStatus:     finalPaymentStatus,
        isCredit,
        status:            finalPaymentStatus === 'paid' ? 'completed' : 'pending',
        paymentType,
        amountPaid,
        balanceRemaining,
      });
    });

    return result(true);
  } catch (error) {
    console.error('Error executing transaction:', error);
    return result(false, null, error.message);
  }
};

/** Alias retained for call-sites that still use the old name. */
export const processManualSale = executeTransaction;

// ---------------------------------------------------------------------------
// Order subscriptions
// ---------------------------------------------------------------------------

/**
 * Real-time subscription to all orders, ordered newest-first.
 * Each document is normalised before being passed to the callback.
 *
 * @param {(orders: object[]) => void} callback
 * @returns {() => void} Unsubscribe function.
 */
export const subscribeOrders = (callback) => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((doc) =>
        normalizeOrder({ id: doc.id, ...doc.data() })
      );
      callback(orders);
    },
    (error) => {
      console.error('Error fetching orders:', error);
      callback([]);
    }
  );
};

// ---------------------------------------------------------------------------
// Order mutations
// ---------------------------------------------------------------------------

/**
 * Atomically updates an order's fulfillment status, adjusting inventory stock
 * when transitioning between fulfilled and non-fulfilled states.
 *
 * @param {string} orderId
 * @param {'fulfilled'|'not_fulfilled'|'returned'} newFulfillmentStatus
 */
export const updateOrderFulfillmentStatus = async (orderId, newFulfillmentStatus) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error('Order not found');

      const orderData        = normalizeOrder(orderDoc.data());
      const currentFulfillment = orderData.fulfillmentStatus;

      const wasStockDeducted  = currentFulfillment === 'fulfilled';
      const willStockDeducted = newFulfillmentStatus === 'fulfilled';
      const stockWillChange   =
        (wasStockDeducted && !willStockDeducted) ||
        (!wasStockDeducted && willStockDeducted);

      // Phase 1 — reads.
      const productReads = [];
      if (stockWillChange) {
        for (const item of orderData.items || []) {
          if (!item.id) continue;
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists()) {
            productReads.push({
              ref:          productRef,
              currentStock: productDoc.data().stock || 0,
              quantity:     Number(item.quantity || 0),
            });
          }
        }
      }

      // Phase 2 — writes.
      if (wasStockDeducted && !willStockDeducted) {
        for (const { ref, currentStock, quantity } of productReads) {
          transaction.update(ref, { stock: currentStock + quantity });
        }
      } else if (!wasStockDeducted && willStockDeducted) {
        for (const { ref, currentStock, quantity } of productReads) {
          transaction.update(ref, { stock: Math.max(0, currentStock - quantity) });
        }
      }

      const updates = {
        fulfillmentStatus: newFulfillmentStatus,
        status: newFulfillmentStatus === 'fulfilled'
          ? (orderData.paymentStatus === 'paid' ? 'completed' : 'pending')
          : 'cancelled',
      };

      // Returning an unfulfilled credit sale voids the outstanding debt.
      if (
        newFulfillmentStatus === 'returned' &&
        orderData.isCredit &&
        orderData.balanceRemaining > 0
      ) {
        updates.balanceRemaining = 0;
        updates.paymentStatus    = 'unpaid';
      }

      transaction.update(orderRef, updates);
    });

    return result(true);
  } catch (error) {
    console.error('Error updating fulfillment status:', error);
    return result(false, null, error.message);
  }
};

/** Backward-compatible alias. */
export const updateOrderStatus = updateOrderFulfillmentStatus;

/**
 * Updates the payment type and derived status of an order.
 *
 * @param {string} orderId
 * @param {'Paid'|'Unpaid'|'paid'|'unpaid'} paymentStatus
 * @param {string} paymentType
 */
export const updateOrderPayment = async (orderId, paymentStatus, paymentType) => {
  try {
    const normStatus  = paymentStatus === 'Paid' || paymentStatus === 'paid' ? 'paid' : 'unpaid';
    const updateData  = {
      paymentStatus: normStatus,
      paymentType:   paymentType || 'Cash',
    };

    if (normStatus === 'paid') {
      updateData.status           = 'completed';
      updateData.balanceRemaining = 0;
    } else {
      updateData.status = 'pending';
    }

    await updateDoc(doc(db, 'orders', orderId), updateData);
    return result(true);
  } catch (error) {
    console.error('Error updating order payment:', error);
    return result(false, null, error.message);
  }
};

/**
 * Records a partial or full payment against a credit order.
 * Marks the order as fully paid when the balance reaches zero.
 *
 * @param {string} orderId
 * @param {number} paymentAmount
 */
export const recordCreditorPayment = async (orderId, paymentAmount) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error('Order not found');

      const orderData        = normalizeOrder(orderDoc.data());
      const grandTotal       = Number(orderData.net_total || orderData.total || 0);
      const currentPaid      = Number(orderData.amountPaid || 0);
      const newAmountPaid    = currentPaid + Number(paymentAmount);
      const newBalance       = Math.max(0, grandTotal - newAmountPaid);
      const isFullyPaid      = newBalance === 0;

      const updates = { amountPaid: newAmountPaid, balanceRemaining: newBalance };
      if (isFullyPaid) {
        updates.paymentStatus = 'paid';
        updates.status        = 'completed';
      }

      transaction.update(orderRef, updates);
    });

    return result(true);
  } catch (error) {
    console.error('Error recording creditor payment:', error);
    return result(false, null, error.message);
  }
};
