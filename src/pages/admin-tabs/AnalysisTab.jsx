import { TrendingUp, Tag } from 'lucide-react';

/**
 * AnalysisTab Component
 * Renders performance audit metrics (Gross, Discounts, Net Revenue, Net Profit, Margin Erosion),
 * discount frequencies, top discounted products, and audit log.
 */
const AnalysisTab = ({
  analysisRange,
  setAnalysisRange,
  analysisStats,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-900 border border-gray-800 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-800">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
            Business Performance Analysis
            <TrendingUp className="w-6 h-6 text-accentOrange opacity-80" />
          </h2>
          <p className="text-xs text-gray-400 font-semibold mt-1">
            Detailed financial audits and cashier discount tracking for Riders Gear Nairobi.
          </p>
        </div>

        {/* Toggle Summary Pills */}
        <div className="flex bg-black/40 p-1 rounded-xl shadow-inner border border-gray-800 shrink-0">
          <button
            onClick={() => setAnalysisRange('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              analysisRange === 'all'
                ? 'bg-accentOrange text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setAnalysisRange('weekly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              analysisRange === 'weekly'
                ? 'bg-accentOrange text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Weekly Summary
          </button>
          <button
            onClick={() => setAnalysisRange('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              analysisRange === 'monthly'
                ? 'bg-accentOrange text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between min-h-28">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 leading-none">
            Gross Revenue
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight tabular-nums flex items-baseline mt-auto">
            <span className="text-accentOrange text-xs font-bold mr-1 leading-none uppercase">KES</span>
            {analysisStats.totalGrossRevenue.toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between min-h-28">
          <span className="text-[9px] font-black uppercase tracking-widest text-green-500 block mb-2 leading-none">
            Total Discounts
          </span>
          <h3 className="text-2xl font-black text-green-500 tracking-tight tabular-nums flex items-baseline mt-auto">
            <span className="text-green-500 text-xs font-bold mr-1 leading-none uppercase">KES</span>
            {analysisStats.totalDiscountsGiven.toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between min-h-28">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 leading-none">
            Net Revenue
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight tabular-nums flex items-baseline mt-auto">
            <span className="text-accentOrange text-xs font-bold mr-1 leading-none uppercase">KES</span>
            {analysisStats.netRevenueCollected.toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between min-h-28">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2 leading-none">
            Actual Net Profit
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight tabular-nums flex items-baseline mt-auto">
            <span className="text-accentOrange text-xs font-bold mr-1 leading-none uppercase">KES</span>
            {analysisStats.actualNetProfit.toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between min-h-28">
          <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block mb-2 leading-none">
            Margin Erosion
          </span>
          <h3 className="text-2xl font-black text-red-500 tracking-tight tabular-nums flex items-baseline mt-auto">
            <span className="text-red-500 text-xs font-bold mr-1 leading-none uppercase">KES</span>
            {analysisStats.marginErosion.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 pb-3 border-b border-gray-800">
              Discount Frequency & Activity
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Discount Rate</span>
                <p className="text-3xl font-extrabold text-white">
                  {(() => {
                    const total = analysisStats.discountedSalesCount + analysisStats.fullPriceSalesCount;
                    return total > 0 ? ((analysisStats.discountedSalesCount / total) * 100).toFixed(1) : '0.0';
                  })()}%
                </p>
                <p className="text-[10px] text-gray-500 font-medium">of transactions were discounted.</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Discounted Orders</span>
                <p className="text-3xl font-extrabold text-gray-500">
                  <span className="text-green-500">{analysisStats.discountedSalesCount}</span>
                  <span className="mx-1 text-gray-700">/</span>
                  <span>{analysisStats.discountedSalesCount + analysisStats.fullPriceSalesCount}</span>
                </p>
                <p className="text-[10px] text-gray-500 font-medium">completed sales with manual pricing overrides.</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Full-Price Orders</span>
                <p className="text-3xl font-extrabold text-gray-500">
                  <span className="text-white">{analysisStats.fullPriceSalesCount}</span>
                  <span className="mx-1 text-gray-700">/</span>
                  <span>{analysisStats.discountedSalesCount + analysisStats.fullPriceSalesCount}</span>
                </p>
                <p className="text-[10px] text-gray-500 font-medium">completed sales sold at standard catalog pricing.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 pb-3 border-b border-gray-800">
              Top Discounted Products
            </h4>

            {analysisStats.topDiscountedProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs font-medium italic">
                No discounted product listings in this period.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {analysisStats.topDiscountedProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-white uppercase leading-none">{p.name}</p>
                      <span className="text-[10px] text-gray-500 font-medium mt-1 block">
                        {p.count} units sold with manual pricing adjustments
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-red-400 shrink-0">
                      - KES {p.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-lg lg:col-span-1 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-800 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Audit Log
            </h4>
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
              {analysisStats.discountedSalesCount} DISCOUNTED SALES
            </span>
          </div>

          {analysisStats.discountedSalesList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 bg-black/20 border border-gray-800 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 font-medium italic">
                No manual overrides recorded in this time range.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-gray-800 pr-1">
              {analysisStats.discountedSalesList.map((order, idx) => {
                const orderDiscount = (order.items || []).reduce((acc, item) => {
                  const orig = item.originalPrice !== undefined ? item.originalPrice : (item.original_price !== undefined ? item.original_price : item.price);
                  const final = item.finalPrice !== undefined ? item.finalPrice : (item.final_price !== undefined ? item.final_price : item.price);
                  return acc + (Math.max(0, orig - final) * (item.quantity || 1));
                }, 0);

                return (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-white leading-none">
                          {order.customerName || 'Cashier Sale'}
                        </p>
                        <span className="text-[9px] text-gray-500 font-medium mt-1 block">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-black text-red-400">
                        - KES {orderDiscount.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-gray-800/40 space-y-1">
                      {(order.items || []).map((item, itemIdx) => {
                        const orig = item.originalPrice !== undefined ? item.originalPrice : (item.original_price !== undefined ? item.original_price : item.price);
                        const final = item.finalPrice !== undefined ? item.finalPrice : (item.final_price !== undefined ? item.final_price : item.price);
                        const discount = Math.max(0, orig - final) * (item.quantity || 1);
                        if (discount <= 0) return null;
                        return (
                          <div key={itemIdx} className="flex justify-between text-[9px] text-gray-400 font-medium">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-red-400/80 font-bold">- KES {discount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-500 italic mt-8 bg-transparent border-t border-gray-800/60 pt-6 leading-relaxed">
        Note: Profit is calculated based on the final sold prices recorded at checkout and their corresponding buying prices. Margin Erosion measures the potential gross revenue forfeited to customer discounts. Only completed sales transactions are compiled here.
      </p>
    </div>
  );
};

export default AnalysisTab;
