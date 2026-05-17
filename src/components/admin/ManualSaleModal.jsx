import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { processManualSale } from '../../firebase/products';

const ManualSaleModal = ({ isOpen, onClose, products }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentType, setPaymentType] = useState('Cash'); // Cash, Credit
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // Paid, Unpaid
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Reset all state when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setShowReceipt(false);
      setLastOrder(null);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setPaymentType('Cash');
      setPaymentStatus('Paid');
      setSearchQuery('');
    }
  }, [isOpen]);

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
      setCart([...cart, { 
        ...product, 
        quantity: 1, 
        originalCatalogPrice: product.price,
        minSellPrice: product.minSellPrice || 0
      }]);
    }
    setSearchQuery(''); // clear search after adding
  };

  const updatePrice = (id, newPrice) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, price: Number(newPrice) || 0 } : item
    ));
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

    // Minimum sell price check
    for (const item of cart) {
      const minPrice = Number(item.minSellPrice || 0);
      if (minPrice > 0 && item.price < minPrice) {
        toast.error(
          `Price for "${item.name}" (KES ${item.price.toLocaleString()}) is below the minimum allowed price of KES ${minPrice.toLocaleString()}! Please ask a manager for authorization.`,
          { duration: 6000 }
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const subtotalOriginal = cart.reduce((sum, item) => sum + ((item.originalCatalogPrice || item.price) * item.quantity), 0);
      const totalDiscount = cart.reduce((sum, item) => sum + (((item.originalCatalogPrice || item.price) - item.price) * item.quantity), 0);

      const orderData = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerAction: 'manual_walk_in',
        paymentType,
        paymentStatus,
        total: grandTotal,
        subtotal_original: subtotalOriginal,
        total_discount: totalDiscount,
        net_total: grandTotal,
        items: cart.map(item => {
          const orig = item.originalCatalogPrice || item.price;
          const discAmount = Math.max(0, orig - item.price);
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            original_price: orig,
            final_price: item.price,
            discount_amount: discAmount,
            discount_percentage: orig > 0 ? (discAmount / orig) * 100 : 0,
            was_discounted: discAmount > 0
          };
        })
      };

      await processManualSale(orderData);
      setLastOrder({ ...orderData, id: 'REC-' + Date.now().toString().slice(-6) });
      toast.success('Sale recorded and stock updated successfully!');
      
      // Don't close immediately, show receipt
      setShowReceipt(true);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setPaymentType('Cash');
      setPaymentStatus('Paid');
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
            {showReceipt ? 'Sale Receipt' : 'Record Physical Sale'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {showReceipt ? (
          <div className="flex-1 overflow-y-auto">
            <ReceiptView 
              order={lastOrder} 
              onPrint={() => window.print()} 
              onClose={onClose} 
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-800 min-h-0">
          
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
                        <span className="text-accentOrange font-black text-xs">KES {p.price?.toLocaleString() || '0'}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">• Stock: {p.stock ?? 0}</span>
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
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px] md:max-h-none">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <ShoppingCart className="w-8 h-8 opacity-20" />
                  <p className="text-xs italic">Add items from the left</p>
                </div>
              ) : (
                cart.map(item => {
                  const origPrice = item.originalCatalogPrice || item.price;
                  const discountVal = Math.max(0, origPrice - item.price);
                  const discountPct = origPrice > 0 ? (discountVal / origPrice) * 100 : 0;
                  const isBelowMin = item.minSellPrice > 0 && item.price < item.minSellPrice;

                  return (
                    <div key={item.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex flex-col gap-2 animate-in fade-in-50 duration-200">
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate flex-1">{item.name}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400 transition shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1 border border-gray-700 shrink-0">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-gray-400 hover:text-white transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0, item.stock)}
                            className="w-10 text-sm font-bold text-center bg-transparent text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-gray-400 hover:text-white transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-black text-white shrink-0">
                          KES {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                        </span>
                      </div>

                      {/* Selling price input with dynamic feedback */}
                      <div className="pt-2 border-t border-gray-800/40 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Unit Sell Price</label>
                          {discountVal > 0 && (
                            <span className="text-[10px] text-green-400 font-bold">
                              Discount: KES {discountVal.toLocaleString()} (-{discountPct.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">KES</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updatePrice(item.id, e.target.value)}
                            placeholder="0"
                            className={`w-full bg-gray-900 border ${isBelowMin ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-800 focus:border-accentOrange focus:ring-accentOrange/30'} rounded-lg pl-10 pr-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-1 transition`}
                          />
                        </div>
                        {isBelowMin && (
                          <div className="flex items-center gap-1.5 text-[9px] text-red-500 font-black uppercase tracking-wider animate-pulse mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>Below min allowed KES {item.minSellPrice.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
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

              {(() => {
                const subtotalOriginal = cart.reduce((sum, item) => sum + ((item.originalCatalogPrice || item.price) * item.quantity), 0);
                const totalDiscount = cart.reduce((sum, item) => sum + (((item.originalCatalogPrice || item.price) - item.price) * item.quantity), 0);
                return (
                  <div className="space-y-2 border-t border-gray-800 pt-3">
                    <div className="flex justify-between text-xs text-gray-400 font-bold">
                      <span>Gross Total</span>
                      <span>KES {subtotalOriginal.toLocaleString()}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-xs text-green-400 font-bold">
                        <span>Discount Given</span>
                        <span>- KES {totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end pt-1">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Net Total</span>
                      <span className="text-2xl font-black text-accentOrange italic">KES {(grandTotal || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

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
        )}

      </div>
    </div>
  );
};

// Simple printable receipt component
const ReceiptView = ({ order, onPrint, onClose }) => {
  if (!order) return null;

  return (
    <div className="flex flex-col h-full bg-white text-black p-8 font-mono">
      <div className="flex justify-between items-start mb-8 print:hidden">
        <h2 className="text-xl font-bold text-gray-800">Sale Receipt Generated</h2>
        <div className="flex gap-2">
          <button 
            onClick={onPrint}
            className="bg-accentOrange text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-accentOrange/20"
          >
            Print Receipt
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            Done
          </button>
        </div>
      </div>

      <div id="receipt-content" className="max-w-sm mx-auto border-2 border-dashed border-gray-300 p-6 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-black uppercase tracking-tighter mb-1">LIGHTSOURCE MOTORS</h1>
          <p className="text-[10px] text-gray-600">Performance & Reliability</p>
          <div className="h-px bg-black/10 my-4" />
          <p className="text-xs font-bold uppercase">Official Receipt</p>
          <p className="text-[10px] mt-1 text-gray-500">{new Date().toLocaleString()}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-[10px]">
            <span className="font-bold uppercase">Receipt #:</span>
            <span>{order.id}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="font-bold uppercase">Customer:</span>
            <span>{order.customerName}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="font-bold uppercase">Payment:</span>
            <span>{order.paymentType} ({order.paymentStatus})</span>
          </div>
        </div>

        <div className="border-t border-b border-black py-4 mb-6">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left font-black uppercase">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item, i) => {
                const orig = item.original_price !== undefined ? item.original_price : item.price;
                const final = item.final_price !== undefined ? item.final_price : item.price;
                const discountAmount = Math.max(0, orig - final);
                const discountPct = orig > 0 ? (discountAmount / orig) * 100 : 0;
                
                return (
                  <tr key={i}>
                    <td className="py-2 pr-2 leading-tight">
                      <div className="flex flex-col">
                        <span className="uppercase">{item.name}</span>
                        {discountAmount > 0 && (
                          <span className="text-[8px] text-gray-500 italic">
                            Catalog: KES {orig.toLocaleString()} (-{discountPct.toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{(final * item.quantity).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 mb-8">
          {order.total_discount > 0 ? (
            <div className="border-b border-dashed border-black/10 pb-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>SUBTOTAL (GROSS)</span>
                <span>KES {order.subtotal_original?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-bold">
                <span>DISCOUNT GIVEN</span>
                <span>- KES {order.total_discount?.toLocaleString()}</span>
              </div>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-black pt-1">
            <span>TOTAL (NET)</span>
            <span>KES {(order.net_total || order.total).toLocaleString()}</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2">Thank you for your business!</p>
          <div className="w-16 h-1 bg-black mx-auto mb-2" />
          <p className="text-[8px] text-gray-500 italic">Goods once sold are not returnable</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: none;
          }
        }
      `}} />
    </div>
  );
};

export default ManualSaleModal;
