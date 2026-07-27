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
      const paymentStatus = orderData.paymentStatus || 'Paid';
      const initialStatus = orderData.status || (paymentStatus === 'Unpaid' || paymentType === 'Credit' ? 'pending' : 'completed');
      
      const amountPaid = orderData.amountPaid !== undefined 
        ? Number(orderData.amountPaid) 
        : (paymentStatus === 'Paid' ? netTotal : 0);
      const balanceRemaining = Math.max(0, netTotal - amountPaid);

      const newOrderRef = doc(ordersCollection);
      transaction.set(newOrderRef, {
        ...orderData,
        items: itemsWithCost,
        subtotal_original: subtotalOriginal,
        total_discount: totalDiscount,
        net_total: netTotal,
        flaggedForReview: flaggedForReview,
        createdAt: serverTimestamp(),
        status: initialStatus,
        paymentType: paymentType,
        paymentStatus: paymentStatus,
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

export const subscribeOrders = (callback) => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(orders);
  }, (error) => {
    console.error("Error fetching orders: ", error);
    callback([]);
  });
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order not found");
      }

      const orderData = orderDoc.data();
      const currentStatus = orderData.status;

      // Handle stock restoration/re-deduction on cancellation changes
      if (currentStatus !== 'cancelled' && newStatus === 'cancelled') {
        // Restore stock
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
      } else if (currentStatus === 'cancelled' && newStatus !== 'cancelled') {
        // Re-deduct stock
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

      transaction.update(orderRef, { status: newStatus });
    });
    return result(true);
  } catch (error) {
    console.error("Error updating order status: ", error);
    return result(false, null, error.message);
  }
};

export const updateOrderPayment = async (orderId, paymentStatus, paymentType) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData = { 
      paymentStatus,
      paymentType: paymentType || 'Cash' 
    };
    // If setting to Paid, mark status as completed and balanceRemaining as 0
    if (paymentStatus === 'Paid') {
      updateData.status = 'completed';
      updateData.balanceRemaining = 0;
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

      const orderData = orderDoc.data();
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
        updates.paymentStatus = 'Paid';
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
