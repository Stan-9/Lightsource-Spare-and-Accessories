import { useState, useMemo } from 'react';
import { Plus, Search, FileText, DollarSign, CheckCircle, XCircle, ChevronRight, X, Trash2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createPurchaseOrder,
  placePurchaseOrder,
  cancelPurchaseOrder,
  recordPoPayment,
} from '../../../services/procurement/procurementService';
import { derivePoPaymentStatus, deriveLineStatus } from '../../../services/procurement/procurementUtils';

const PurchaseOrdersView = ({
  suppliers,
  purchaseOrders,
  purchaseLines,
  products,
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoForDetail, setSelectedPoForDetail] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPo, setPaymentPo] = useState(null);

  // New PO Form state
  const [newPoSupplierId, setNewPoSupplierId] = useState('');
  const [newPoInvoiceRef, setNewPoInvoiceRef] = useState('');
  const [newPoDispatchDate, setNewPoDispatchDate] = useState('');
  const [newPoCurrency, setNewPoCurrency] = useState('KES');
  const [newPoFxRate, setNewPoFxRate] = useState(1);
  const [poItems, setPoItems] = useState([]);

  // Line creation temp input
  const [tempProductSearch, setTempProductSearch] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [tempUnitCost, setTempUnitCost] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('payment'); // payment | refund
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  // Filtered POs
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (filterStatus !== 'all' && po.status !== filterStatus) return false;
      if (filterSupplier !== 'all' && po.supplierId !== filterSupplier) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const numMatch = po.poNumber?.toLowerCase().includes(query);
        const invMatch = po.supplierInvoiceRef?.toLowerCase().includes(query);
        if (!numMatch && !invMatch) return false;
      }
      return true;
    });
  }, [purchaseOrders, filterStatus, filterSupplier, searchQuery]);

  const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);

  // Handle adding line to draft PO form
  const handleAddLineToDraft = (product) => {
    const cost = tempUnitCost !== '' ? Number(tempUnitCost) : Number(product?.buyingPrice || 0);
    const existing = poItems.find(i => i.productId === product.id);

    if (existing) {
      setPoItems(poItems.map(i => i.productId === product.id ? { ...i, qtyOrdered: i.qtyOrdered + Number(tempQty) } : i));
    } else {
      setPoItems([...poItems, {
        productId: product.id,
        productName: product.name,
        qtyOrdered: Number(tempQty) || 1,
        unitCost: cost,
      }]);
    }

    setTempProductSearch('');
    setTempQty(1);
    setTempUnitCost('');
  };

  const handleRemoveDraftLine = (index) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handleCreatePoSubmit = async (e) => {
    e.preventDefault();
    if (!newPoSupplierId) {
      toast.error('Please select a supplier');
      return;
    }
    if (poItems.length === 0) {
      toast.error('Add at least one product line to the PO');
      return;
    }

    try {
      const res = await createPurchaseOrder(
        {
          supplierId: newPoSupplierId,
          supplierInvoiceRef: newPoInvoiceRef.trim(),
          expectedDispatchDate: newPoDispatchDate,
          currency: newPoCurrency,
          fxRateToKES: Number(newPoFxRate || 1),
          status: 'draft',
        },
        poItems
      );

      if (res && res.success) {
        toast.success('Purchase Order draft created!');
        setIsCreateModalOpen(false);
        setPoItems([]);
        setNewPoSupplierId('');
        setNewPoInvoiceRef('');
      } else {
        toast.error(res?.error || 'Failed to create PO');
      }
    } catch {
      toast.error('Failed to create Purchase Order');
    }
  };

  const handlePlacePo = async (poId) => {
    try {
      const res = await placePurchaseOrder(poId);
      if (res && res.success) {
        toast.success('Purchase Order placed!');
        if (selectedPoForDetail?.id === poId) {
          setSelectedPoForDetail(prev => ({ ...prev, status: 'placed' }));
        }
      } else {
        toast.error(res?.error || 'Failed to place PO');
      }
    } catch {
      toast.error('Failed to place PO');
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      const res = await recordPoPayment(paymentPo.id, {
        type: payType,
        amount: Number(payAmount),
        method: payMethod,
        reference: payRef.trim(),
        by: 'admin',
      });
      if (res && res.success) {
        toast.success('Payment record saved');
        setIsPaymentModalOpen(false);
        setPayAmount('');
        setPayRef('');
      } else {
        toast.error(res?.error || 'Failed to record payment');
      }
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const filteredSearchProducts = useMemo(() => {
    if (!tempProductSearch.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(tempProductSearch.toLowerCase()))
      .slice(0, 5);
  }, [products, tempProductSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search PO # or Invoice..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange w-full sm:w-48"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="placed">Placed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto bg-accentOrange hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </button>
      </div>

      {/* PO Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-800/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Total Cost</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500 italic">
                    No purchase orders found. Click "Create Purchase Order" to make your first draft.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => {
                  const supplier = supplierMap.get(po.supplierId);
                  const payInfo = derivePoPaymentStatus(po);

                  return (
                    <tr key={po.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-4 font-bold text-white">
                        {po.poNumber}
                        {po.supplierInvoiceRef && (
                          <span className="block text-[10px] text-gray-500 font-normal">Inv: {po.supplierInvoiceRef}</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-300">
                        {supplier?.name || 'Unknown Supplier'}
                      </td>
                      <td className="p-4 text-gray-400">
                        {po.orderDate}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          po.status === 'placed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          po.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-4 font-black text-white">
                        KES {Number(po.totalCost || 0).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          payInfo.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' :
                          payInfo.paymentStatus === 'partial' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {payInfo.paymentStatus} ({payInfo.totalPaid.toLocaleString()} / {payInfo.totalCost.toLocaleString()})
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedPoForDetail(po)}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {po.status === 'draft' && (
                            <button
                              onClick={() => handlePlacePo(po.id)}
                              className="px-2.5 py-1 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 rounded-lg text-[10px] font-bold transition"
                            >
                              Place PO
                            </button>
                          )}

                          <button
                            onClick={() => { setPaymentPo(po); setIsPaymentModalOpen(true); }}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg transition"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
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

      {/* Create PO Fast Entry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-accentOrange" />
                Create Purchase Order Draft
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePoSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 font-bold mb-2">Supplier *</label>
                  <select
                    required
                    value={newPoSupplierId}
                    onChange={e => setNewPoSupplierId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-accentOrange"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-2">Supplier Invoice Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-8829"
                    value={newPoInvoiceRef}
                    onChange={e => setNewPoInvoiceRef(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-accentOrange"
                  />
                </div>
              </div>

              {/* Fast Line Entry Table */}
              <div className="border border-gray-800 rounded-2xl p-4 bg-black/40 space-y-4">
                <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider">Fast Line Entry Table</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-6 relative">
                    <input
                      type="text"
                      placeholder="Search product to add..."
                      value={tempProductSearch}
                      onChange={e => setTempProductSearch(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
                    />
                    {filteredSearchProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl z-20 overflow-hidden shadow-2xl">
                        {filteredSearchProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleAddLineToDraft(p)}
                            className="w-full text-left p-2.5 hover:bg-gray-700 text-xs text-white flex justify-between items-center"
                          >
                            <span>{p.name}</span>
                            <span className="text-accentOrange font-bold text-[10px]">Buying: KES {p.buyingPrice || 0}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={tempQty}
                      onChange={e => setTempQty(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange text-center"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="number"
                      placeholder="Unit Cost KES"
                      value={tempUnitCost}
                      onChange={e => setTempUnitCost(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
                    />
                  </div>
                </div>

                {/* Draft PO Items List */}
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                  {poItems.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 italic py-4">No items added to draft yet.</p>
                  ) : (
                    poItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-800/80 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{item.productName}</span>
                          <span className="text-gray-400 ml-2">x{item.qtyOrdered} @ KES {item.unitCost}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-accentOrange">KES {(item.qtyOrdered * item.unitCost).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftLine(idx)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-800 text-xs font-bold text-white">
                  <span>Total Draft PO Cost:</span>
                  <span className="text-lg text-accentOrange italic font-black">
                    KES {poItems.reduce((sum, i) => sum + (i.qtyOrdered * i.unitCost), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl text-xs hover:bg-orange-600 transition"
                >
                  Save PO Draft
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && paymentPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Record Payment for {paymentPo.poNumber}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Transaction Type</label>
                <select
                  value={payType}
                  onChange={e => setPayType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                >
                  <option value="payment">Payment to Supplier</option>
                  <option value="refund">Refund from Supplier</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50000"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mpesa">M-Pesa</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Reference / Transaction Code</label>
                <input
                  type="text"
                  placeholder="e.g. QKJ892301"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchaseOrdersView;
