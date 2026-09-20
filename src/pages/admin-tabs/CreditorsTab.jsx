import { TrendingDown, AlertCircle } from 'lucide-react';

/**
 * CreditorsTab Component
 * Renders the outstanding debts table, credit age indicator, partial payment inputs, and mark fully paid action.
 */
const CreditorsTab = ({
  activeCreditorOrders,
  partialPaymentInputs,
  setPartialPaymentInputs,
  handleRecordPartialPayment,
  handleUpdateOrderPayment,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:h-[calc(100vh-80px)]">
      <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
        Creditors Tracker
        <TrendingDown className="w-6 h-6 text-red-500 opacity-50" />
      </h2>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1 md:h-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
              <tr>
                <th className="p-4">Customer/Time</th>
                <th className="p-4">Total Order</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Balance Remaining</th>
                <th className="p-4">Credit Age</th>
                <th className="p-4 text-center">Record Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {activeCreditorOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 italic">
                    No outstanding debts found. Good job!
                  </td>
                </tr>
              ) : (
                activeCreditorOrders.map((order) => {
                  const grandTotal = Number(order.net_total || order.total || 0);
                  const paidAmount = Number(order.amountPaid !== undefined ? order.amountPaid : (order.paymentStatus === 'Paid' ? grandTotal : 0));
                  const balance = Number(order.balanceRemaining !== undefined ? order.balanceRemaining : (order.paymentStatus === 'Paid' ? 0 : grandTotal));

                  const createdAtDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt ? new Date(order.createdAt) : new Date());
                  const ageInDays = Math.floor((new Date() - createdAtDate) / (1000 * 60 * 60 * 24));
                  const isOverdue = ageInDays >= 2;

                  return (
                    <tr key={order.id} className={`transition group ${isOverdue ? 'bg-red-500/5' : 'hover:bg-gray-800/30'}`}>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{order.customerName || 'WhatsApp Customer'}</span>
                          <span className="text-[10px] text-gray-500">{createdAtDate.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-300">KES {grandTotal.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-green-400">KES {paidAmount.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`font-black italic ${isOverdue ? 'text-red-500' : 'text-accentOrange'}`}>
                          KES {balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isOverdue ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                            {ageInDays} Days Old
                          </span>
                          {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" title="Overdue Alert!" />}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              placeholder="Amount"
                              value={partialPaymentInputs[order.id] || ''}
                              onChange={(e) => setPartialPaymentInputs({ ...partialPaymentInputs, [order.id]: e.target.value })}
                              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accentOrange"
                            />
                            <button
                              onClick={() => handleRecordPartialPayment(order.id)}
                              className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500 hover:text-white transition whitespace-nowrap"
                            >
                              Pay Partial
                            </button>
                          </div>
                          <button
                            onClick={() => handleUpdateOrderPayment(order.id, 'Paid', 'Credit')}
                            className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded-lg text-xs font-black uppercase hover:bg-green-500 hover:text-white transition whitespace-nowrap"
                          >
                            Mark Fully Paid
                          </button>
                        </div>
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

export default CreditorsTab;
