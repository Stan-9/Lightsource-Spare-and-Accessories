import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { processManualSale } from '../../firebase/products';

const ManualSaleModal = ({ isOpen, onClose, products }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentType, setPaymentType] = useState('Cash'); // Cash, Credit
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // Paid, Unpaid
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products that have stock > 0 and match search
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.stock > 0)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10); // show top 10 matches for performance in modal
  }, [products, searchQuery]);

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        toast.error(`Only ${product.stock} units available in stock`);
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchQuery(''); // clear search after adding
  };

  const updateQuantity = (id, newQuantity, maxStock) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.id !== id));
      return;
    }
    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} units available`);
      return;
    }
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerAction: 'manual_walk_in',
        paymentType,
        paymentStatus,
        total: grandTotal,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      await processManualSale(orderData);
      toast.success('Sale recorded and stock updated successfully!');
      
      // Reset form on success
      setCart([]);
      setCustomerName('Walk-in Customer');
      setPaymentType('Cash');
      setPaymentStatus('Paid');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-darkBg border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-accentOrange" />
            Record Physical Sale
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-800">
          
          {/* Left panel: Product Selection */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-900/30">
            <div className="p-4 border-b border-gray-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition shadow-inner"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 opacity-50 space-y-3">
                  <Package className="w-10 h-10 mx-auto text-gray-600" />
                  <p className="text-sm italic">No products found or in stock</p>
                </div>
              ) : (
                filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 border border-transparent hover:border-gray-700 transition group"
                  >
                    <div className="w-12 h-12 bg-gray-900 rounded-lg overflow-hidden shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600 uppercase">No Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-200 truncate group-hover:text-white">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-accentOrange font-black text-xs">KES {p.price.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">• Stock: {p.stock}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-accentOrange group-hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Cart Details */}
          <div className="w-full md:w-96 flex flex-col min-h-0 bg-darkBg">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 shrink-0">
              <h3 className="font-bold text-gray-300 uppercase tracking-widest text-xs">Current Sale ({cart.length} items)</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <ShoppingCart className="w-8 h-8 opacity-20" />
                  <p className="text-xs italic">Add items from the left</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-bold text-white truncate flex-1">{item.name}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1 border border-gray-700">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-gray-400 hover:text-white transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-gray-400 hover:text-white transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-black text-white">
                        KES {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Checkout Form */}
            <div className="p-5 border-t border-gray-800 bg-gray-900 shrink-0 space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accentOrange transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full bg-black/40 border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-accentOrange transition"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select
                      value={paymentType}
                      onChange={(e) => {
                        setPaymentType(e.target.value);
                        setPaymentStatus(e.target.value === 'Credit' ? 'Unpaid' : 'Paid');
                      }}
                      className="w-full bg-black/40 border border-gray-700 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accentOrange appearance-none"
                    >
                      <option value="Cash">Cash/Mpesa</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full bg-black/40 border border-gray-700 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accentOrange appearance-none"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-800 pt-3">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Grand Total</span>
                <span className="text-2xl font-black text-accentOrange italic">KES {grandTotal.toLocaleString()}</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-accentOrange hover:bg-orange-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition transform active:scale-[0.98] disabled:transform-none shadow-lg disabled:shadow-none shadow-accentOrange/20"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManualSaleModal;
