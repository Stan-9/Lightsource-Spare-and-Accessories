import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { logOrder } from '../firebase/products';
import { auth } from '../firebase/config';
import Header from '../components/shared/Header';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Phone, User, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: auth.currentUser?.displayName || '',
    phone: '',
    address: '',
    notes: ''
  });

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 text-gray-700 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-accentOrange px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition"
        >
          Go Back to Store
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
        ...formData,
        items: cartItems,
        total: cartTotal,
        customerAction: 'online_order',
        paymentStatus: 'Unpaid',
        status: 'pending'
      };

      await logOrder(orderData);
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white font-poppins">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-black mb-12 tracking-tighter uppercase">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Delivery Info */}
          <div className="space-y-8">
            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accentOrange/5 rounded-full blur-3xl" />
              
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <MapPin className="text-accentOrange" />
                Delivery Information
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-accentOrange transition"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-accentOrange transition"
                      placeholder="e.g. 0700 000 000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-600" />
                    <textarea
                      required
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-accentOrange transition"
                      placeholder="Where should we deliver?"
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Order Notes (Optional)</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl py-4 px-6 focus:outline-none focus:border-accentOrange transition"
                    placeholder="Anything else we should know?"
                  ></textarea>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-8">
            <div className="bg-gray-800/30 border border-gray-700/50 p-8 rounded-[2.5rem] sticky top-8">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <ShoppingBag className="text-accentOrange" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-900/40 p-4 rounded-2xl border border-gray-800">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity} × KES {item.price.toLocaleString()}</p>
                    </div>
                    <span className="font-black text-white">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-6 space-y-4">
                <div className="flex justify-between text-gray-400 font-medium">
                  <span>Subtotal</span>
                  <span>KES {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400 font-medium">
                  <span>Delivery</span>
                  <span className="text-green-400 text-xs font-black uppercase tracking-widest">Calculated at dispatch</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-sm font-black uppercase tracking-widest text-gray-500">Total</span>
                  <span className="text-3xl font-black text-accentOrange italic">KES {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-accentOrange hover:bg-orange-600 text-white font-black py-5 rounded-2xl mt-10 flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(255,107,0,0.3)] transition transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Placing Order...</span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Complete Purchase
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-gray-500 text-center mt-6 uppercase font-black tracking-widest leading-relaxed">
                By clicking "Complete Purchase", you agree to our <br /> Terms of Service and Refund Policy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
