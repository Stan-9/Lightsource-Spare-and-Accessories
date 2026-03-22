import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

import { logOrder } from '../../firebase/products';

const CartDrawer = ({ whatsappNumber }) => {
  const { 
    cartItems, 
    isDrawerOpen, 
    closeDrawer, 
    removeFromCart, 
    updateQuantity, 
    grandTotal 
  } = useCart();

  const [customerName, setCustomerName] = useState('');

  const handleWhatsAppCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    if (!whatsappNumber) {
      toast.error('Store WhatsApp number not configured!');
      return;
    }

    // Prepare order data for Firestore
    const orderData = {
      customerName: customerName || 'WhatsApp Customer',
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: grandTotal,
      customerAction: 'whatsapp_redirect'
    };

    // Log the order silently
    await logOrder(orderData);

    let message = "Hello! I'd like to order the following parts:\n\n🛒 ORDER:\n";
    
    cartItems.forEach(item => {
      const lineTotal = item.price * item.quantity;
      message += `• ${item.name} x${item.quantity} — KES ${lineTotal.toLocaleString()}\n`;
    });

    message += `\n💰 TOTAL: KES ${grandTotal.toLocaleString()}\n\nPlease confirm and advise on delivery. Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    toast.success('Opening WhatsApp...');
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-darkBg border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold flex items-center text-white">
            Your Cart
          </h2>
          <button 
            onClick={closeDrawer}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-6">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center relative shadow-inner">
                <ShoppingCart className="w-12 h-12 text-gray-600" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-gray-700 rounded-full border-2 border-darkBg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-200">Your cart is empty</h3>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Looks like you haven't added anything to your cart yet. Let's find some spare parts!
                </p>
              </div>
              <button 
                onClick={closeDrawer}
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl transition-all font-semibold border border-gray-700 shadow-sm"
              >
                Go Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="group relative flex gap-4 p-4 rounded-2xl bg-gray-800/30 border border-gray-700/50 hover:border-accentOrange/30 hover:bg-gray-800/50 transition-all duration-300">
                  <div className="w-24 h-24 rounded-xl bg-gray-900 border border-gray-800 shrink-0 overflow-hidden flex items-center justify-center shadow-lg group-hover:shadow-accentOrange/5">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-gray-700 text-[10px] uppercase font-bold tracking-widest">No Image</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-gray-200 truncate pr-2 group-hover:text-white transition-colors">
                          {item.name}
                        </h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all active:scale-90"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-accentOrange font-black text-sm mt-0.5">
                        KES {item.price.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-gray-700/50">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold w-10 text-center text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                          disabled={item.quantity >= item.stock}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase font-black block tracking-tighter">Line Total</span>
                        <span className="text-white font-bold text-sm">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-800 bg-gray-900 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] relative z-10">
            <div className="space-y-4 mb-6">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accentOrange transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text"
                  placeholder="Your Name (for our records)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-accentOrange/50 focus:ring-1 focus:ring-accentOrange/20 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-400 text-sm font-medium">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="text-gray-200">KES {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400 text-sm font-medium">
                  <span>Estimated Delivery</span>
                  <span className="text-green-500">Quote on Whatsapp</span>
                </div>
                <div className="h-px bg-gray-800 my-1" />
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-black block tracking-widest mb-0.5">Total Amount</span>
                    <span className="text-2xl font-black text-white leading-none">KES {grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="bg-accentOrange/10 text-accentOrange text-[10px] font-black px-2.5 py-1 rounded-full border border-accentOrange/20">
                    SECURE CHECKOUT
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleWhatsAppCheckout}
              className="w-full bg-accentOrange hover:bg-orange-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(255,107,0,0.3)] group"
            >
              Order via WhatsApp
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white animate-ping" />
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-4 uppercase tracking-[0.2em] font-medium leading-relaxed">
              We provide delivery across all regions
            </p>
          </div>
        )}
      </div>
    </>
  );
};


export default CartDrawer;
