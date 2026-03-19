import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const CartDrawer = ({ whatsappNumber }) => {
  const { 
    cartItems, 
    isDrawerOpen, 
    closeDrawer, 
    removeFromCart, 
    updateQuantity, 
    grandTotal 
  } = useCart();

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    if (!whatsappNumber) {
      toast.error('Store WhatsApp number not configured!');
      return;
    }

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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-500" />
              </div>
              <p>Your cart is empty.</p>
              <button 
                onClick={closeDrawer}
                className="text-accentOrange hover:underline text-sm font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700 items-start">
                <div className="w-20 h-20 rounded-lg bg-gray-900 border border-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 text-xs">No img</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-200 truncate pr-6">{item.name}</h3>
                  <div className="text-accentOrange font-bold text-sm mt-1">
                    KES {item.price.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 bg-gray-900 rounded-lg border border-gray-700">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                        disabled={item.quantity <= 1}
                        className="p-1 px-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 px-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
            <div className="flex justify-between items-center mb-4 text-gray-300">
              <span className="font-medium">Grand Total</span>
              <span className="text-xl font-bold text-white">KES {grandTotal.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleWhatsAppCheckout}
              className="w-full bg-accentOrange hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_20px_rgba(255,107,0,0.5)]"
            >
              Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Also import ShoppingCart here as it is used in empty state
import { ShoppingCart } from 'lucide-react';
export default CartDrawer;
