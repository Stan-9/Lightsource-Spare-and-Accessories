import { Search, Plus, Printer } from 'lucide-react';
import { normalizeOrder, getOrderStatus } from '../../services/sales';

/**
 * OrdersTab Component
 * Renders the customer order log table, search filters, fulfillment/payment dropdowns, and print receipt action.
 */
const OrdersTab = ({
  orders,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  orderPaymentFilter,
  setOrderPaymentFilter,
  setIsSaleModalOpen,
  handleUpdateOrderFulfillmentStatus,
  handleUpdateOrderPayment,
  handlePrintReceipt,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:h-[calc(100vh-80px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-white border-b border-gray-800 pb-4">Customer Orders Log</h2>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="bg-accentOrange hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-accentOrange/20 transition flex items-center gap-2 transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Record Physical Sale
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer or item..."
            value={orderSearch}
            onChange={e => setOrderSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accentOrange transition"
          />
        </div>
        <select
          value={orderStatusFilter}
          onChange={e => setOrderStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accentOrange"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={orderPaymentFilter}
          onChange={e => setOrderPaymentFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accentOrange"
        >
          <option value="all">All Payments</option>
          <option value="Cash">Cash / Mpesa</option>
          <option value="Credit">Credit</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1 md:h-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Action</th>
                <th className="p-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {(() => {
                const filtered = orders.filter(rawOrder => {
                  const o = normalizeOrder(rawOrder);
                  const derivedStatus = getOrderStatus(o);
                  const matchSearch = !orderSearch ||
                    (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                    (o.items || []).some(i => i.name?.toLowerCase().includes(orderSearch.toLowerCase()));
                  const matchStatus = orderStatusFilter === 'all' || derivedStatus === orderStatusFilter;
                  const matchPayment = orderPaymentFilter === 'all' || o.paymentType === orderPaymentFilter;
                  return matchSearch && matchStatus && matchPayment;
                });
                if (filtered.length === 0) return (
                  <tr><td colSpan="6" className="p-12 text-center text-gray-500 italic">No orders match your filters.</td></tr>
                );
                return filtered.map((rawOrder) => {
                  const order = normalizeOrder(rawOrder);
                  const derivedStatus = getOrderStatus(order);
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition group">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Processing...'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{order.customerName || '—'}</span>
                            {order.flaggedForReview && (
                              <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0">
                                Discounted
                              </span>
                            )}
                          </div>
                          {order.phone && <span className="text-[10px] text-gray-500">{order.phone}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-300">
                              <span className="text-accentOrange font-bold">{(item.quantity || 1)}x</span> {item.name || 'Unknown Item'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-white italic">KES {(order.total || 0).toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <select
                            value={order.fulfillmentStatus || 'fulfilled'}
                            onChange={(e) => handleUpdateOrderFulfillmentStatus(order.id, e.target.value)}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded border transition ${
                              derivedStatus === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                              derivedStatus === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                              'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                            }`}
                          >
                            {order.fulfillmentStatus === 'fulfilled' ? (
                              <>
                                <option value="fulfilled">Fulfilled (Active)</option>
                                <option value="not_fulfilled">Cancel (Not Fulfilled)</option>
                                <option value="returned">Return (Stock Restored)</option>
                              </>
                            ) : order.fulfillmentStatus === 'not_fulfilled' ? (
                              <>
                                <option value="not_fulfilled">Cancelled (Not Fulfilled)</option>
                                <option value="fulfilled">Fulfill Order (Deduct Stock)</option>
                              </>
                            ) : (
                              <>
                                <option value="returned">Cancelled (Returned)</option>
                                <option value="fulfilled">Fulfill Order (Deduct Stock)</option>
                              </>
                            )}
                          </select>
                          <select
                            value={order.paymentType || 'Cash'}
                            onChange={(e) => {
                              const newType = e.target.value;
                              handleUpdateOrderPayment(order.id, newType === 'Credit' ? 'Unpaid' : 'Paid', newType);
                            }}
                            className="text-[10px] font-black uppercase px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-400"
                          >
                            <option value="Cash">Cash/Mpesa</option>
                            <option value="Credit">Credit</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="p-2 bg-gray-800 text-gray-400 hover:text-white hover:bg-accentOrange/20 border border-transparent hover:border-accentOrange/30 rounded-lg transition"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersTab;
