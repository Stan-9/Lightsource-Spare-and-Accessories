import { useState, useMemo } from 'react';
import { DollarSign, Tag, TrendingUp, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProduct } from '../../../services/inventory';
import { isProductSellable } from '../../../services/procurement/procurementUtils';

const NeedsPricingView = ({ products }) => {
  const [priceInputs, setPriceInputs] = useState({});

  // Filter products in the Needs Pricing Queue (unpriced received items)
  const unpricedProducts = useMemo(() => {
    return products.filter(p => !isProductSellable(p) && (p.buyingPrice || 0) > 0);
  }, [products]);

  const handlePriceChange = (productId, val) => {
    setPriceInputs(prev => ({ ...prev, [productId]: val }));
  };

  const handleSavePrice = async (product) => {
    const inputVal = Number(priceInputs[product.id] || 0);
    if (isNaN(inputVal) || inputVal <= 0) {
      toast.error('Enter a valid selling price greater than 0');
      return;
    }
    if (inputVal < product.buyingPrice) {
      toast.error(`Selling price (KES ${inputVal}) cannot be less than landed cost (KES ${product.buyingPrice})`);
      return;
    }

    try {
      const res = await updateProduct(
        product.id,
        product,
        {
          ...product,
          price: inputVal,
          isVisible: true, // Mark visible & sellable
        }
      );

      if (res && res.success) {
        toast.success(`Price updated for "${product.name}"! Product is now live and sellable.`);
        setPriceInputs(prev => ({ ...prev, [product.id]: '' }));
      } else {
        toast.error(res?.error || 'Failed to update price');
      }
    } catch {
      toast.error('Failed to update product price');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs">
      
      <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-accentOrange" />
            Needs Pricing Queue ({unpricedProducts.length})
          </h3>
          <p className="text-gray-400 mt-1">
            Newly received items whose stock is physically counted but hidden from buyers until you set a selling price.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Landed Cost (Buying)</th>
                <th className="p-4">Set Selling Price</th>
                <th className="p-4">Margin Preview</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {unpricedProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500 italic">
                    No items in the pricing queue. All received inventory has valid selling prices!
                  </td>
                </tr>
              ) : (
                unpricedProducts.map(p => {
                  const enteredPrice = Number(priceInputs[p.id] || 0);
                  const landedCost = Number(p.buyingPrice || 0);
                  const marginAmt = enteredPrice > 0 ? enteredPrice - landedCost : 0;
                  const marginPct = enteredPrice > 0 ? (marginAmt / enteredPrice) * 100 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-800/30 transition">
                      <td className="p-4 font-bold text-white">{p.name}</td>
                      <td className="p-4 text-gray-400">{p.category || 'General'}</td>
                      <td className="p-4 font-bold text-blue-400">{p.stock} units</td>
                      <td className="p-4 font-black text-white">KES {landedCost.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">KES</span>
                          <input
                            type="number"
                            min="1"
                            placeholder="Selling Price"
                            value={priceInputs[p.id] || ''}
                            onChange={e => handlePriceChange(p.id, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-3 py-2 text-white font-bold focus:outline-none focus:border-accentOrange"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        {enteredPrice > 0 ? (
                          <div className="flex flex-col">
                            <span className={`font-black ${marginAmt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              + KES {marginAmt.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400">Margin: {marginPct.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Enter price</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleSavePrice(p)}
                          className="px-4 py-2 bg-accentOrange hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition"
                        >
                          Release to Shop
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default NeedsPricingView;
