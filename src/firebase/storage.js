import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// Upload image and return the download URL
export const uploadProductImage = async (file) => {
  if (!file) return null;
  
  // Create a unique filename based on current timestamp and original name
  const filename = `products/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filename);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

// Delete image from storage using its URL
export const deleteProductImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('firebaseapp.com')) return;
  
  try {
    // Extract file path from the full URL (crude but effective approach for Firebase Storage urls)
    // The path is between "/o/" and "?alt=media"
    const pathMatch = imageUrl.match(/o\/(.+?)\?alt=media/);
    if (pathMatch && pathMatch[1]) {
      const decodedPath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Error deleting image: ", error);
    // don't throw, just log to prevent deletion failure from blocking product delete
  }
};
