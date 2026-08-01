import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

const ordersCollection = collection(db, 'orders');

const result = (success, data = null, error = null) => ({ success, data, error });

export const logOrder = async (orderData) => {
  try {
    const itemsWithCost = (orderData.items || []).map(item => {
      const price = Number(item.price || 0);
      return {
        id: item.id,
        name: item.name,
        price: price,
        buyingPrice: item.buyingPrice || 0,
        quantity: item.quantity,
        original_price: price,
        final_price: price,
        discount_amount: 0,
        discount_percentage: 0,
        was_discounted: false,
      };
    });

    const total = Number(orderData.total || 0);

    const newOrder = {
      ...orderData,
      items: itemsWithCost,
      subtotal_original: total,
      total_discount: 0,
      net_total: total,
      flaggedForReview: false,
      createdAt: serverTimestamp(),
      status: 'pending',
      paymentType: orderData.paymentType || 'Cash',
      paymentStatus: orderData.paymentStatus || 'Paid',
    };
    const docRef = await addDoc(ordersCollection, newOrder);
    return result(true, { id: docRef.id });
  } catch (error) {
    console.error("Error logging order: ", error);
    return result(false, null, error.message);
  }
};

export const executeTransaction = async (orderData) => {
  try {
    await runTransaction(db, async (transaction) => {
      const productDocs = [];

      for (const item of orderData.items) {
        const productRef = doc(db, 'products', item.id);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error(`Product "${item.name}" no longer exists in inventory.`);
        }
        productDocs.push({
          ref: productRef,
          data: productDoc.data(),
          item,
        });
      }

      for (const { ref, data, item } of productDocs) {
        const newStock = Math.max(0, data.stock - item.quantity);
        transaction.update(ref, { stock: newStock });
      }

      const itemsWithCost = productDocs.map(({ data, item }) => {
        const originalPrice = Number(data.price || 0);
        const finalPrice = Number(item.price);
        const discountAmount = Math.max(0, originalPrice - finalPrice);
        const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
        const wasDiscounted = discountAmount > 0;

        return {
          id: item.id,
          name: item.name,
          price: finalPrice,
          buyingPrice: data.buyingPrice || 0,
          quantity: item.quantity,
          original_price: originalPrice,
          final_price: finalPrice,
          discount_amount: discountAmount,
          discount_percentage: discountPercentage,
          was_discounted: wasDiscounted,
        };
      });

      const subtotalOriginal = itemsWithCost.reduce((sum, item) => sum + (item.original_price * item.quantity), 0);
      const totalDiscount = itemsWithCost.reduce((sum, item) => sum + (item.discount_amount * item.quantity), 0);
      const netTotal = itemsWithCost.reduce((sum, item) => sum + (item.final_price * item.quantity), 0);
      const flaggedForReview = itemsWithCost.some(item => item.was_discounted);

      const paymentType = orderData.paymentType || 'Cash';
      const isCredit = Boolean(orderData.isCredit !== undefined ? orderData.isCredit : (paymentType === 'Credit'));
      const rawPaymentStatus = orderData.paymentStatus || (paymentType === 'Credit' ? 'Unpaid' : 'Paid');
      const normalizedPaymentStatus = (rawPaymentStatus === 'Paid' || rawPaymentStatus === 'paid') ? 'paid' : 'unpaid';
      
      const amountPaid = orderData.amountPaid !== undefined 
        ? Number(orderData.amountPaid) 
        : (normalizedPaymentStatus === 'paid' ? netTotal : 0);
      const balanceRemaining = Math.max(0, netTotal - amountPaid);
      const finalPaymentStatus = balanceRemaining === 0 ? 'paid' : 'unpaid';
      const fulfillmentStatus = orderData.fulfillmentStatus || 'fulfilled';

      const newOrderRef = doc(ordersCollection);
      transaction.set(newOrderRef, {
        ...orderData,
        items: itemsWithCost,
        subtotal_original: subtotalOriginal,
        total_discount: totalDiscount,
        net_total: netTotal,
        flaggedForReview: flaggedForReview,
        createdAt: serverTimestamp(),
        fulfillmentStatus: fulfillmentStatus,
        paymentStatus: finalPaymentStatus,
        isCredit: isCredit,
        status: finalPaymentStatus === 'paid' ? 'completed' : 'pending',
        paymentType: paymentType,
        amountPaid: amountPaid,
        balanceRemaining: balanceRemaining,
      });
    });
    return result(true);
  } catch (error) {
    console.error("Error executing transaction: ", error);
    return result(false, null, error.message);
  }
};

export const normalizeOrder = (order) => {
  if (!order) return order;
  if (order.fulfillmentStatus) {
    return {
      ...order,
      paymentStatus: (order.paymentStatus === 'Paid' || order.paymentStatus === 'paid') ? 'paid' : 'unpaid',
      isCredit: Boolean(order.isCredit !== undefined ? order.isCredit : (order.paymentType === 'Credit')),
    };
  }

  // Legacy document migration mapping
  const oldStatus = order.status || 'pending';
  const paymentType = order.paymentType || 'Cash';
  const customerAction = order.customerAction;
  let fulfillmentStatus = 'fulfilled';
  let paymentStatus = (order.paymentStatus === 'Paid' || order.paymentStatus === 'paid') ? 'paid' : 'unpaid';
  let isCredit = paymentType === 'Credit';

  if (oldStatus === 'completed') {
    fulfillmentStatus = 'fulfilled';
    paymentStatus = 'paid';
  } else if (oldStatus === 'cancelled') {
    fulfillmentStatus = 'not_fulfilled';
    paymentStatus = 'unpaid';
  } else {
    // oldStatus === 'pending'
    if (paymentType === 'Credit') {
      fulfillmentStatus = 'fulfilled';
      paymentStatus = 'unpaid';
      isCredit = true;
    } else if (customerAction === 'online_order') {
      fulfillmentStatus = 'fulfilled';
      paymentStatus = 'unpaid';
      isCredit = false;
    } else if (customerAction === 'whatsapp_redirect') {
      fulfillmentStatus = 'not_fulfilled';
      paymentStatus = 'unpaid';
      isCredit = false;
    } else {
      // Fallback for pending missing both customerAction and paymentType
      fulfillmentStatus = 'fulfilled';
      paymentStatus = 'unpaid';
      isCredit = false;
    }
  }

  return {
    ...order,
    fulfillmentStatus,
    paymentStatus,
    isCredit,
  };
};

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

export const subscribeOrders = (callback) => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => normalizeOrder({
      id: doc.id,
      ...doc.data()
    }));
    callback(orders);
  }, (error) => {
    console.error("Error fetching orders: ", error);
    callback([]);
  });
};

export const updateOrderFulfillmentStatus = async (orderId, newFulfillmentStatus) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order not found");
      }

      const rawOrderData = orderDoc.data();
      const orderData = normalizeOrder(rawOrderData);
      const currentFulfillment = orderData.fulfillmentStatus;

      // Handle stock restoration/re-deduction on fulfillment transitions
      const wasStockDeducted = currentFulfillment === 'fulfilled';
      const willStockBeDeducted = newFulfillmentStatus === 'fulfilled';

      if (wasStockDeducted && !willStockBeDeducted) {
        // Restore stock (transitioning to returned or not_fulfilled from fulfilled)
        for (const item of (orderData.items || [])) {
          if (item.id) {
            const productRef = doc(db, 'products', item.id);
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists()) {
              const currentStock = productDoc.data().stock || 0;
              transaction.update(productRef, { stock: currentStock + item.quantity });
            }
          }
        }
      } else if (!wasStockDeducted && willStockBeDeducted) {
        // Re-deduct stock (transitioning to fulfilled from returned or not_fulfilled)
        for (const item of (orderData.items || [])) {
          if (item.id) {
            const productRef = doc(db, 'products', item.id);
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists()) {
              const currentStock = productDoc.data().stock || 0;
              transaction.update(productRef, { stock: Math.max(0, currentStock - item.quantity) });
            }
          }
        }
      }

      const updates = { 
        fulfillmentStatus: newFulfillmentStatus,
        status: newFulfillmentStatus === 'fulfilled' 
          ? (orderData.paymentStatus === 'paid' ? 'completed' : 'pending')
          : 'cancelled'
      };

      // Special transition rule: Return after fulfillment on unpaid credit sale voids debt
      if (newFulfillmentStatus === 'returned' && orderData.isCredit && orderData.balanceRemaining > 0) {
        updates.balanceRemaining = 0;
        updates.paymentStatus = 'unpaid'; // Debt is voided; payment status remains unpaid / zeroed balance
      }

      transaction.update(orderRef, updates);
    });
    return result(true);
  } catch (error) {
    console.error("Error updating order fulfillment status: ", error);
    return result(false, null, error.message);
  }
};

// Compatibility export
export const updateOrderStatus = updateOrderFulfillmentStatus;

export const updateOrderPayment = async (orderId, paymentStatus, paymentType) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const normStatus = (paymentStatus === 'Paid' || paymentStatus === 'paid') ? 'paid' : 'unpaid';
    const updateData = { 
      paymentStatus: normStatus,
      paymentType: paymentType || 'Cash' 
    };
    if (normStatus === 'paid') {
      updateData.status = 'completed';
      updateData.balanceRemaining = 0;
    } else {
      updateData.status = 'pending';
    }
    await updateDoc(orderRef, updateData);
    return result(true);
  } catch (error) {
    console.error("Error updating order payment: ", error);
    return result(false, null, error.message);
  }
};

export const recordCreditorPayment = async (orderId, paymentAmount) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order not found");
      }

      const orderData = normalizeOrder(orderDoc.data());
      const grandTotal = Number(orderData.net_total || orderData.total || 0);
      const currentPaid = Number(orderData.amountPaid || 0);
      const newAmountPaid = currentPaid + Number(paymentAmount);
      const newBalanceRemaining = Math.max(0, grandTotal - newAmountPaid);
      const isFullyPaid = newBalanceRemaining === 0;

      const updates = {
        amountPaid: newAmountPaid,
        balanceRemaining: newBalanceRemaining,
      };

      if (isFullyPaid) {
        updates.paymentStatus = 'paid';
        updates.status = 'completed';
      }

      transaction.update(orderRef, updates);
    });
    return result(true);
  } catch (error) {
    console.error("Error recording creditor payment: ", error);
    return result(false, null, error.message);
  }
};
