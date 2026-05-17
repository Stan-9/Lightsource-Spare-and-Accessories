import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { processManualSale } from '../firebase/products';
import Header from '../components/shared/Header';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Phone, User, ShoppingBag, ShoppingCart } from 'lucide-react';

// Validate Kenyan phone numbers (07xx or 01xx, 10 digits)
const isValidKenyanPhone = (phone) => /^(0[17]\d{8}|254[17]\d{8})$/.test(phone.replace(/\s/g, ''));

const Checkout = () => {
  const { cartItems, grandTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    notes: '',
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

    if (!formData.customerName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!isValidKenyanPhone(formData.phone)) {
      toast.error('Please enter a valid Kenyan phone number (e.g. 0712 345 678)');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: 'anonymous',
        email: 'anonymous@customer.com',
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        // Items include buyingPrice snapshot — processManualSale handles that internally
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          buyingPrice: item.buyingPrice || 0,
          quantity: item.quantity,
        })),
        total: grandTotal,
        customerAction: 'online_order',
        paymentType: 'Cash',
        paymentStatus: 'Unpaid',
      };

      // Use processManualSale so stock is atomically deducted
      await processManualSale(orderData);

      // Notify admin via WhatsApp if number is configured
      notifyAdminWhatsApp(orderData);

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white font-poppins">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-black mb-12 tracking-tighter uppercase font-technical">Procurement / Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Delivery Info */}
          <div className="space-y-8">
            <div className="bg-machineGray/10 border-2 border-machineGray p-8 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accentOrange/5 rounded-full blur-3xl" />

              <h2 className="text-xl font-bold mb-8 flex items-center gap-3 uppercase font-technical tracking-tighter">
                <MapPin className="text-accentOrange" />
                Logistics / Delivery
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6 font-utilitarian">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 font-technical">
                    Consignee Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full bg-machineGray/20 border-2 border-machineGray rounded-sm py-4 pl-12 pr-6 focus:outline-none focus:border-accentOrange transition font-technical text-xs tracking-widest uppercase"
                      placeholder="ENTER FULL NAME"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 font-technical">
                    Contact Signal (Phone) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-machineGray/20 border-2 border-machineGray rounded-sm py-4 pl-12 pr-6 focus:outline-none focus:border-accentOrange transition font-technical text-xs tracking-widest uppercase"
                      placeholder="07XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 font-technical">
                    Destination Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-600" />
                    <textarea
                      required
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-machineGray/20 border-2 border-machineGray rounded-sm py-4 pl-12 pr-6 focus:outline-none focus:border-accentOrange transition font-technical text-xs tracking-widest uppercase"
                      placeholder="ESTATE, ROAD, TOWN / CITY"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl py-4 px-6 focus:outline-none focus:border-accentOrange transition"
                    placeholder="Any special delivery instructions?"
                  />
                </div>
              </form>
            </div>
          </div>          {/* Order Summary */}
          <div>
            <div className="bg-machineGray/10 border-2 border-machineGray p-8 rounded-sm sticky top-24">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3 uppercase font-technical tracking-tighter">
                <ShoppingCart className="text-accentOrange" />
                Manifest / Summary
              </h2>

              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-16 h-16 bg-pitchBlack border border-machineGray rounded-sm overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-[10px] uppercase tracking-widest truncate font-technical">{item.name}</h4>
                      <p className="text-gray-500 text-[9px] font-black uppercase mt-1 font-technical">UNIT_PRICE: KES {item.price.toLocaleString()}</p>
                      <p className="text-accentOrange text-[9px] font-black uppercase mt-1 font-technical">QUANTITY: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-black text-xs font-technical">KES {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-machineGray pt-6 space-y-4 font-technical">
                <div className="flex justify-between text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>Subtotal / Base</span>
                  <span>KES {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>Logistics / Delivery</span>
                  <span className="text-machineryGreen">FREE_SERVICE</span>
                </div>
                <div className="border-t border-machineGray pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-accentOrange text-[10px] font-black uppercase tracking-[0.4em] block mb-1">Total Payable</span>
                    <span className="text-3xl font-black text-white">
                      <span className="text-accentOrange text-sm mr-1">KES</span>
                      {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || cartItems.length === 0}
                className={`w-full mt-8 py-5 rounded-sm font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all font-technical ${
                  loading || cartItems.length === 0
                    ? 'bg-machineGray/50 text-gray-700 cursor-not-allowed'
                    : 'bg-accentOrange hover:bg-orange-600 text-white shadow-[0_15px_40px_rgba(255,107,0,0.2)] hover:scale-[1.02] active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    CONFIRM ACQUISITION
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * Sends a WhatsApp message to the admin when an online order is placed.
 * Uses the shop's whatsapp number from Firestore settings if available.
 * This is fire-and-forget — we don't block the order on this.
 */
async function notifyAdminWhatsApp(orderData) {
  try {
    const { getSettings } = await import('../firebase/products');
    const settings = await getSettings();
    const adminNumber = settings?.whatsappNumber;
    if (!adminNumber) return;

    const itemsList = orderData.items
      .map(i => `• ${i.name} x${i.quantity} — KES ${(i.price * i.quantity).toLocaleString()}`)
      .join('\n');

    const message =
      `🛒 *NEW ONLINE ORDER*\n\n` +
      `*Customer:* ${orderData.customerName}\n` +
      `*Phone:* ${orderData.phone}\n` +
      `*Address:* ${orderData.address}\n` +
      (orderData.notes ? `*Notes:* ${orderData.notes}\n` : '') +
      `\n*Items:*\n${itemsList}\n\n` +
      `*TOTAL: KES ${orderData.total.toLocaleString()}*\n\n` +
      `Payment: ${orderData.paymentType} · ${orderData.paymentStatus}`;

    window.open(
      `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  } catch (err) {
    // Non-critical — don't surface to the customer
    console.warn('Admin WhatsApp notification failed:', err);
  }
}

export default Checkout;
