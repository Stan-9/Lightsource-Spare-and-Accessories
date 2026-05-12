import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  getDoc,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadProductImage, deleteProductImage } from '../firebase/storage';

const productsCollection = collection(db, 'products');

/**
 * Result wrapper for consistent API responses
 */
const result = (success, data = null, error = null) => ({ success, data, error });

export const subscribeProducts = (callback) => {
  const q = query(productsCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(products);
  }, (error) => {
    console.error("Error fetching products: ", error);
    callback([]);
  });
};

export const addProduct = async (productData, imageFile) => {
  try {
    let imageUrl = productData.imageUrl || '';
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }
    
    const newProduct = {
      ...productData,
      price: Number(productData.price),
      buyingPrice: Number(productData.buyingPrice || 0),
      stock: Number(productData.stock),
      imageUrl,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(productsCollection, newProduct);
    return result(true, { id: docRef.id });
  } catch (error) {
    console.error("Error adding product: ", error);
    return result(false, null, error.message);
  }
};

export const updateProduct = async (id, currentData, updatedData, newImageFile = null) => {
  try {
    const productRef = doc(db, 'products', id);
    let imageUrl = updatedData.imageUrl || currentData.imageUrl || '';
    
    if (newImageFile) {
      imageUrl = await uploadProductImage(newImageFile);
      if (currentData.imageUrl) {
        await deleteProductImage(currentData.imageUrl);
      }
    }
    
    await updateDoc(productRef, {
      ...updatedData,
      price: Number(updatedData.price),
      buyingPrice: Number(updatedData.buyingPrice || 0),
      stock: Number(updatedData.stock),
      imageUrl
    });
    return result(true);
  } catch (error) {
    console.error("Error updating product: ", error);
    return result(false, null, error.message);
  }
};

export const updateProductStock = async (id, newStock) => {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      stock: Number(newStock)
    });
    return result(true);
  } catch (error) {
    console.error("Error updating stock: ", error);
    return result(false, null, error.message);
  }
};

export const deleteProduct = async (id, imageUrl) => {
  try {
    if (imageUrl) {
      await deleteProductImage(imageUrl);
    }
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    return result(true);
  } catch (error) {
    console.error("Error deleting product: ", error);
    return result(false, null, error.message);
  }
};

// --- Categories ---

const categoriesDoc = doc(db, 'settings', 'categories');

export const getCategories = async () => {
  try {
    const snapshot = await getDoc(categoriesDoc);
    return snapshot.exists() ? snapshot.data().list || [] : [];
  } catch (error) {
    console.error("Error fetching categories: ", error);
    return [];
  }
};

export const updateCategoriesList = async (list) => {
  try {
    await setDoc(categoriesDoc, { list });
    return result(true);
  } catch (error) {
    console.log("Error updating categories list: ", error);
    return result(false, null, error.message);
  }
};

export const subscribeCategories = (callback) => {
  return onSnapshot(categoriesDoc, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().list || [] : []);
  });
};
