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
    const itemsWithCost = (orderData.items || []).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      buyingPrice: item.buyingPrice || 0,
      quantity: item.quantity,
    }));

    const newOrder = {
      ...orderData,
      items: itemsWithCost,
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

      const itemsWithCost = productDocs.map(({ data, item }) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        buyingPrice: data.buyingPrice || 0,
        quantity: item.quantity,
      }));

      const newOrderRef = doc(ordersCollection);
      transaction.set(newOrderRef, {
        ...orderData,
        items: itemsWithCost,
        createdAt: serverTimestamp(),
        status: orderData.status || 'completed',
        paymentType: orderData.paymentType || 'Cash',
        paymentStatus: orderData.paymentStatus || 'Paid',
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

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
    return result(true);
  } catch (error) {
    console.error("Error updating order status: ", error);
    return result(false, null, error.message);
  }
};

export const updateOrderPayment = async (orderId, paymentStatus, paymentType) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { 
      paymentStatus,
      paymentType: paymentType || 'Cash' 
    });
    return result(true);
  } catch (error) {
    console.error("Error updating order payment: ", error);
    return result(false, null, error.message);
  }
};
