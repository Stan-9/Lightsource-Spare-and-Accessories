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
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadProductImage, deleteProductImage } from '../firebase/storage';
import { result } from './shared';

const productsCollection = collection(db, 'products');
const categoriesDoc      = doc(db, 'settings', 'categories');

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * Real-time subscription to the products collection, ordered newest-first.
 *
 * @param {(products: object[]) => void} callback
 * @returns {() => void} Unsubscribe function.
 */
export const subscribeProducts = (callback) => {
  const q = query(productsCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(products);
    },
    (error) => {
      console.error('Error fetching products:', error);
      callback([]);
    }
  );
};

/**
 * Adds a new product, optionally uploading an image to Cloudinary first.
 *
 * @param {object} productData - Product fields (price, stock, etc.)
 * @param {File|null} [imageFile] - Optional image file to upload.
 */
export const addProduct = async (productData, imageFile) => {
  try {
    let imageUrl = productData.imageUrl || '';
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }

    const newProduct = {
      ...productData,
      price:        Number(productData.price),
      buyingPrice:  Number(productData.buyingPrice  || 0),
      minSellPrice: Number(productData.minSellPrice || 0),
      stock:        Number(productData.stock),
      imageUrl,
      createdAt:    serverTimestamp(),
    };

    const docRef = await addDoc(productsCollection, newProduct);
    return result(true, { id: docRef.id });
  } catch (error) {
    console.error('Error adding product:', error);
    return result(false, null, error.message);
  }
};

/**
 * Updates an existing product. Replaces the image if a new file is provided.
 *
 * @param {string} id           - Firestore document ID.
 * @param {object} currentData  - Existing product data (used for old image URL).
 * @param {object} updatedData  - New field values.
 * @param {File|null} [newImageFile]
 */
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
      price:        Number(updatedData.price),
      buyingPrice:  Number(updatedData.buyingPrice  || 0),
      minSellPrice: Number(updatedData.minSellPrice || 0),
      stock:        Number(updatedData.stock),
      imageUrl,
    });

    return result(true);
  } catch (error) {
    console.error('Error updating product:', error);
    return result(false, null, error.message);
  }
};

/**
 * Directly overwrites the stock value for a product.
 *
 * @param {string} id       - Firestore document ID.
 * @param {number} newStock - Absolute new stock level.
 */
export const updateProductStock = async (id, newStock) => {
  try {
    await updateDoc(doc(db, 'products', id), { stock: Number(newStock) });
    return result(true);
  } catch (error) {
    console.error('Error updating stock:', error);
    return result(false, null, error.message);
  }
};

/**
 * Deletes a product and attempts to remove its image from Cloudinary.
 * Image deletion failure is non-fatal — the product will still be removed.
 *
 * @param {string} id        - Firestore document ID.
 * @param {string} [imageUrl]
 */
export const deleteProduct = async (id, imageUrl) => {
  try {
    if (imageUrl) {
      try {
        await deleteProductImage(imageUrl);
      } catch (imgErr) {
        console.warn('Could not remove image, proceeding with product deletion:', imgErr);
      }
    }
    await deleteDoc(doc(db, 'products', id));
    return result(true);
  } catch (error) {
    console.error('Error deleting product:', error);
    return result(false, null, error.message);
  }
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/**
 * One-shot fetch of the categories list.
 *
 * @returns {Promise<string[]>}
 */
export const getCategories = async () => {
  try {
    const snapshot = await getDoc(categoriesDoc);
    return snapshot.exists() ? snapshot.data().list || [] : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Overwrites the entire categories list.
 *
 * @param {string[]} list
 */
export const updateCategoriesList = async (list) => {
  try {
    await setDoc(categoriesDoc, { list });
    return result(true);
  } catch (error) {
    console.error('Error updating categories list:', error);
    return result(false, null, error.message);
  }
};

/**
 * Real-time subscription to the categories list.
 *
 * @param {(categories: string[]) => void} callback
 * @returns {() => void} Unsubscribe function.
 */
export const subscribeCategories = (callback) =>
  onSnapshot(categoriesDoc, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().list || [] : []);
  });
