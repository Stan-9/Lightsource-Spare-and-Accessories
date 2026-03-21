// This file has been updated to use Cloudinary as an alternative to Firebase Storage
// because the Firebase free plan can sometimes have limitations or regional restrictions.

/**
 * Uploads an image to Cloudinary using an unsigned upload preset.
 * To use this, you need:
 * 1. A Cloudinary account (Free)
 * 2. A "Cloud Name" from your dashboard
 * 3. An "Unsigned Upload Preset" from Settings > Upload
 */
export const uploadProductImage = async (file) => {
  if (!file) return null;
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary config missing! Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env");
    throw new Error("Cloudinary not configured");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'products'); // Optional: organize in a folder

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data.secure_url; // This is the public URL of the uploaded image
  } catch (error) {
    console.error("Error uploading to Cloudinary: ", error);
    throw error;
  }
};

/**
 * Deletes an image from Cloudinary.
 * Note: Deleting from the frontend via URL is restricted in Cloudinary for security.
 * On a free plan, we typically allow "orphaned" images to remain since Cloudinary
 * has a generous free tier, or you can use a serverless function to handle deletions.
 */
export const deleteProductImage = async (imageUrl) => {
  console.log("Cloudinary image deletion from frontend skipped (requires signed request). Item will remain in Cloudinary storage.");
  // Usually not a problem on the free tier unless you have thousands of deletes,
  // in which case a small Vercel function would be the way to go.
};
