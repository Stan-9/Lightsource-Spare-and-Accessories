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
import { db } from './config';
import { uploadProductImage, deleteProductImage } from './storage';

const productsCollection = collection(db, 'products');

export const subscribeProducts = (callback) => {
  // Ordered by creation time
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
    // Current imageUrl could be one manually pasted in the form
    let imageUrl = productData.imageUrl || '';
    
    // Attempt upload if file provided - this takes precedence
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }
    
    // Ensure numbers are correct types and prepare full product object
    const newProduct = {
      ...productData,
      price: Number(productData.price),
      stock: Number(productData.stock),
      imageUrl, // Uses either uploaded URL or manual URL
      createdAt: serverTimestamp()
    };
    
    await addDoc(productsCollection, newProduct);
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  }
};

export const updateProduct = async (id, currentData, updatedData, newImageFile = null) => {
  try {
    const productRef = doc(db, 'products', id);
    // Prefer the manual URL if it was changed in form, otherwise keep current
    let imageUrl = updatedData.imageUrl || currentData.imageUrl || '';
    
    if (newImageFile) {
      // Pick file upload if a new file was selected
      imageUrl = await uploadProductImage(newImageFile);
      // Clean up old image if there was one (logic remains same for Firebase or can be extension later)
      if (currentData.imageUrl) {
        await deleteProductImage(currentData.imageUrl);
      }
    }
    
    await updateDoc(productRef, {
      ...updatedData,
      price: Number(updatedData.price),
      stock: Number(updatedData.stock),
      imageUrl
    });
  } catch (error) {
    console.error("Error updating product: ", error);
    throw error;
  }
};

export const updateProductStock = async (id, newStock) => {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      stock: Number(newStock)
    });
  } catch (error) {
    console.error("Error updating stock: ", error);
    throw error;
  }
};

export const deleteProduct = async (id, imageUrl) => {
  try {
    // Try to delete image first
    if (imageUrl) {
      await deleteProductImage(imageUrl);
    }
    // Delete the Firestore document
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error deleting product: ", error);
    throw error;
  }
};

// --- Settings ---

const settingsDoc = doc(db, 'settings', 'shop');

export const getSettings = async () => {
  try {
    const snapshot = await getDoc(settingsDoc);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    // Return defaults if none exists
    return { shopName: "LightSource Motors", whatsappNumber: "254700000000" };
  } catch (error) {
    console.error("Error fetching settings: ", error);
    return { shopName: "LightSource Motors", whatsappNumber: "" };
  }
};

export const updateSettings = async (settingsData) => {
  try {
    await setDoc(settingsDoc, settingsData, { merge: true });
  } catch (error) {
    console.error("Error updating settings: ", error);
    throw error;
  }
};

export const subscribeSettings = (callback) => {
  return onSnapshot(settingsDoc, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ shopName: "LightSource Motors", whatsappNumber: "" });
    }
  }, (error) => {
    console.error("Error subscribing to settings: ", error);
  });
};
