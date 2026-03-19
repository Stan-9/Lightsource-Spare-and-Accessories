import { useState, useEffect } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { addProduct, updateProduct } from '../../firebase/products';
import toast from 'react-hot-toast';

const ProductModal = ({ isOpen, onClose, product = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price || '',
        stock: product.stock || '',
        description: product.description || '',
      });
      setImagePreview(product.imageUrl || null);
    } else {
      setFormData({ name: '', category: '', price: '', stock: '', description: '' });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // create preview url
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price || formData.stock === '') {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      if (product) {
        // Edit mode
        await updateProduct(product.id, product, formData, imageFile);
        toast.success("Product updated successfully");
      } else {
        // Add mode
        await addProduct(formData, imageFile);
        toast.success("Product added successfully");
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-darkBg border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-darkBg/95 backdrop-blur z-10 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Upload Area */}
            <div className="w-full md:w-1/3 space-y-2">
              <label className="block text-sm font-medium text-gray-400">Product Image</label>
              <div 
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden h-48 relative transition ${
                  imagePreview ? 'border-gray-700 bg-gray-900' : 'border-gray-700 hover:border-accentOrange/50 bg-gray-800/50'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                      <span className="text-white font-medium text-sm">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm font-medium text-gray-400">Click to upload</span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Inputs Area */}
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accentOrange transition"
                  placeholder="e.g. Brake Pads set"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category *</label>
                  <input 
                    type="text" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accentOrange transition"
                    placeholder="e.g. Brakes"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Price (KES) *</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accentOrange transition"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Stock Quantity *</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accentOrange transition"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accentOrange transition h-24 resize-none"
              placeholder="Add product details here..."
            />
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end gap-3 sticky bottom-[-24px] bg-darkBg/90 backdrop-blur pb-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:bg-gray-800 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-accentOrange hover:bg-orange-600 rounded-xl font-bold text-white shadow-lg shadow-accentOrange/20 transition flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
