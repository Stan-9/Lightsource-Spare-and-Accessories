import { LayoutDashboard, TrendingUp, TrendingDown, ShoppingCart, AlertCircle, Clock, Plus } from 'lucide-react';

/**
 * OverviewTab Component
 * Renders warehouse valuation, sales stats cards, latest orders, low stock alert, and pending orders.
 */
const OverviewTab = ({
  stats,
  loading,
  orders,
  products,
  setActiveTab,
  setOrderPaymentFilter,
  setOrderStatusFilter,
  handleEditProduct,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-white mb-4 border-b border-gray-800 pb-4 flex items-center gap-3">
        Store Statistics
        <LayoutDashboard className="w-6 h-6 text-accentOrange opacity-50" />
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="col-span-1 lg:col-span-4 bg-gradient-to-r from-accentOrange/20 to-transparent border border-accentOrange/30 p-8 rounded-3xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
              <span className="text-accentOrange font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Warehouse Value (Cost)</span>
              <h3 className="text-3xl font-black text-white tracking-tighter">
                <span className="text-accentOrange text-lg mr-2 font-medium italic">KES</span>
                {stats.inventoryCost.toLocaleString()}
              </h3>
              <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Total money tied in stock</p>
            </div>
            <div className="border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
              <span className="text-green-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Warehouse Value (Retail)</span>
              <h3 className="text-3xl font-black text-white tracking-tighter">
                <span className="text-green-500 text-lg mr-2 font-medium italic">KES</span>
                {stats.totalValue.toLocaleString()}
              </h3>
              <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Expected income after full sale</p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <TrendingUp className="w-64 h-64 rotate-12" />
          </div>
        </div>

        {[
          { label: 'Total Revenue', value: stats.actualSales, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Most Sold Item', value: stats.topPerformer[0], sub: `${stats.topPerformer[1]} units`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Least Sold Item', value: stats.leastPerformer[0], sub: `${stats.leastPerformer[1]} units`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Low Stock Level', value: stats.lowStock, icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-gray-700 transition-all shadow-lg">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tabular-nums truncate max-w-[120px]">{stat.value.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                {stat.sub && <p className="text-[9px] text-gray-600 font-medium italic mt-0.5">{stat.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-accentOrange" />
              Latest Orders
            </h3>
            <button onClick={() => setActiveTab('orders')} className="text-accentOrange text-xs font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 opacity-30 italic text-sm">No orders logged yet</div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 4).map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/30 border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-accentOrange group-hover:text-white transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-bold">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}</p>
                    <h4 className="text-sm font-bold text-white truncate">{order.customerName || `${order.items?.length || 0} items ordered`}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{order.items?.map(i => i.name).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white italic">KES {order.total?.toLocaleString() || '0'}</p>
                    <p className={`text-[10px] uppercase font-black ${order.status === 'completed' ? 'text-green-500' : order.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {order.status || 'pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Low Stock Alert
            </h3>
          </div>
          <div className="space-y-4">
            {products.filter(p => p.stock > 0 && p.stock < 5).slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                <div className="w-10 h-10 rounded-xl bg-gray-900 overflow-hidden shrink-0">
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                  <div className="text-[10px] font-black uppercase mt-1 text-yellow-500">
                    Only {p.stock} units left
                  </div>
                </div>
                <button onClick={() => handleEditProduct(p)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {products.filter(p => p.stock > 0 && p.stock < 5).length === 0 && (
              <div className="text-center py-10 opacity-30 italic text-sm">Inventory levels are healthy</div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending / Unpaid Orders
            </h3>
            <button onClick={() => { setActiveTab('orders'); setOrderPaymentFilter('all'); setOrderStatusFilter('pending'); }} className="text-yellow-500 text-xs font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
            </div>
          ) : orders.filter(o => o.status === 'pending' || (o.paymentType === 'Credit' && o.paymentStatus === 'Unpaid')).length === 0 ? (
            <div className="text-center py-10 opacity-30 italic text-sm">No pending or unpaid orders</div>
          ) : (
            <div className="space-y-4">
              {orders.filter(o => o.status === 'pending' || (o.paymentType === 'Credit' && o.paymentStatus === 'Unpaid')).slice(0, 4).map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-yellow-500">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-bold">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}</p>
                    <h4 className="text-sm font-bold text-white truncate">{order.customerName || `${order.items?.length || 0} items`}</h4>
                    <p className="text-[10px] uppercase font-black text-yellow-500">
                      {order.paymentType === 'Credit' && order.paymentStatus === 'Unpaid' ? 'UNPAID CREDIT' : 'PENDING FULFILLMENT'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white italic">KES {order.total?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
