import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, FileText, DollarSign, CheckCircle, XCircle,
  ChevronRight, X, Trash2, CreditCard, Edit2, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createPurchaseOrder,
  placePurchaseOrder,
  cancelPurchaseOrder,
  recordPoPayment,
  updatePurchaseOrderLines,
  recomputePoTotalCost,
} from '../../../services/procurement/procurementService';
import { derivePoPaymentStatus, deriveLineStatus } from '../../../services/procurement/procurementUtils';

// ---------------------------------------------------------------------------
// Helper: Line-entry row used in both Create and Edit modals
// ---------------------------------------------------------------------------
const LineEntryRow = ({ products, onAdd }) => {
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6);
  }, [products, search]);

  const handleSelect = (product) => {
    setSelectedProduct(product);
    setSearch(product.name);
    setCost(product.buyingPrice ? String(product.buyingPrice) : '');
    setShowDropdown(false);
  };

  const handleAdd = () => {
    const productName = search.trim();
    if (!productName) {
      toast.error('Enter a product name');
      return;
    }
    if (!qty || Number(qty) < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    if (!cost || Number(cost) <= 0) {
      toast.error('Enter a valid unit cost');
      return;
    }

    onAdd({
      productId: selectedProduct?.id || null,
      productName: selectedProduct?.name || productName,
      pendingProduct: selectedProduct ? null : { name: productName },
      qtyOrdered: Number(qty),
      unitCost: Number(cost),
    });

    setSearch('');
    setQty(1);
    setCost('');
    setSelectedProduct(null);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      {/* Product search */}
      <div className="col-span-12 sm:col-span-5 relative" ref={containerRef}>
        <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wide">
          Product
        </label>
        <input
          type="text"
          placeholder="Search or type new product name..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setSelectedProduct(null);
            setShowDropdown(true);
          }}
          onFocus={() => search.trim() && setShowDropdown(true)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl z-30 overflow-hidden shadow-2xl">
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => handleSelect(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-700 text-xs text-white flex justify-between items-center gap-2"
              >
                <span>{p.name}</span>
                <span className="text-accentOrange font-bold text-[10px] shrink-0">
                  KES {p.buyingPrice || 0}
                </span>
              </button>
            ))}
            <button
              type="button"
              onMouseDown={() => {
                setSelectedProduct(null);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2.5 border-t border-gray-700 hover:bg-orange-900/30 text-xs text-accentOrange flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Add &quot;{search}&quot; as new product
            </button>
          </div>
        )}
        {showDropdown && search.trim() && filtered.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl z-30 overflow-hidden shadow-2xl">
            <div className="px-3 py-2.5 text-xs text-accentOrange flex items-center gap-2">
              <Plus className="w-3 h-3" />
              &quot;{search}&quot; will be added as a new product
            </div>
          </div>
        )}
      </div>

      {/* Qty */}
      <div className="col-span-4 sm:col-span-2">
        <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wide">
          Qty
        </label>
        <input
          type="number"
          min="1"
          placeholder="1"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange text-center"
        />
      </div>

      {/* Unit Cost */}
      <div className="col-span-5 sm:col-span-3">
        <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wide">
          Unit Cost (KES)
        </label>
        <input
          type="number"
          placeholder="0"
          value={cost}
          onChange={e => setCost(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
        />
      </div>

      {/* Add button */}
      <div className="col-span-3 sm:col-span-2">
        <label className="block text-[10px] text-transparent mb-1">add</label>
        <button
          type="button"
          onClick={handleAdd}
          className="w-full bg-accentOrange hover:bg-orange-600 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
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

  // Edit PO modal state
  const [editingPo, setEditingPo] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editSaving, setEditSaving] = useState(false);

  // New PO Form state
  const [newPoSupplierId, setNewPoSupplierId] = useState('');
  const [newPoInvoiceRef, setNewPoInvoiceRef] = useState('');
  const [newPoDispatchDate, setNewPoDispatchDate] = useState('');
  const [newPoCurrency, setNewPoCurrency] = useState('KES');
  const [newPoFxRate, setNewPoFxRate] = useState(1);
  const [poItems, setPoItems] = useState([]);

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('payment');
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

  // ---------------------------------------------------------------------------
  // Create PO handlers
  // ---------------------------------------------------------------------------
  const handleAddToDraft = (item) => {
    const existing = poItems.find(i => i.productId && i.productId === item.productId);
    if (existing) {
      setPoItems(poItems.map(i =>
        i.productId === item.productId
          ? { ...i, qtyOrdered: i.qtyOrdered + item.qtyOrdered }
          : i
      ));
      toast.success('Updated qty for ' + item.productName);
    } else {
      setPoItems(prev => [...prev, item]);
      toast.success('Added ' + item.productName);
    }
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
        setNewPoDispatchDate('');
      } else {
        toast.error(res?.error || 'Failed to create PO');
      }
    } catch {
      toast.error('Failed to create Purchase Order');
    }
  };

  // ---------------------------------------------------------------------------
  // Edit PO handlers
  // ---------------------------------------------------------------------------
  const openEditModal = (po) => {
    const lines = purchaseLines
      .filter(l => l.poId === po.id)
      .map(l => ({
        id: l.id,
        productId: l.productId || null,
        productName: l.productId
          ? (products.find(p => p.id === l.productId)?.name || l.productId)
          : (l.pendingProduct?.name || 'Unknown product'),
        qtyOrdered: l.qtyOrdered,
        unitCost: l.unitCost,
        qtyReceived: l.qtyReceived || 0,
        isNew: false,
        toDelete: false,
      }));
    setEditItems(lines);
    setEditingPo(po);
  };

  const handleAddToEdit = (item) => {
    if (item.productId) {
      const existing = editItems.find(i => i.productId === item.productId && !i.toDelete);
      if (existing) {
        setEditItems(editItems.map(i =>
          i.productId === item.productId && !i.toDelete
            ? { ...i, qtyOrdered: i.qtyOrdered + item.qtyOrdered }
            : i
        ));
        toast.success('Updated qty for ' + item.productName);
        return;
      }
    }
    setEditItems(prev => [...prev, { ...item, isNew: true, toDelete: false }]);
    toast.success('Added ' + item.productName);
  };

  const handleToggleDeleteEditLine = (idx) => {
    const line = editItems[idx];
    if (line.qtyReceived > 0) {
      toast.error('Cannot remove a line that has already received goods');
      return;
    }
    setEditItems(editItems.map((l, i) =>
      i === idx ? { ...l, toDelete: !l.toDelete } : l
    ));
  };

  const handleEditPoSave = async () => {
    if (!editingPo) return;

    const linesToAdd = editItems.filter(l => l.isNew && !l.toDelete);
    const lineIdsToRemove = editItems.filter(l => !l.isNew && l.toDelete && l.id).map(l => l.id);

    if (linesToAdd.length === 0 && lineIdsToRemove.length === 0) {
      toast('No changes to save');
      return;
    }

    const remainingCount = editItems.filter(l => !l.toDelete).length;
    if (remainingCount === 0) {
      toast.error('A PO must have at least one line');
      return;
    }

    setEditSaving(true);
    try {
      const res = await updatePurchaseOrderLines(editingPo.id, linesToAdd, lineIdsToRemove);
      if (res && res.success) {
        const survivingLines = editItems.filter(l => !l.toDelete);
        await recomputePoTotalCost(editingPo.id, survivingLines);
        toast.success('Purchase Order updated!');
        setEditingPo(null);
        setEditItems([]);
      } else {
        toast.error(res?.error || 'Failed to update PO');
      }
    } catch {
      toast.error('Failed to update PO');
    } finally {
      setEditSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Place & Payment handlers
  // ---------------------------------------------------------------------------
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

  // Computed edit totals
  const editTotal = useMemo(
    () => editItems.filter(l => !l.toDelete).reduce((s, l) => s + l.qtyOrdered * l.unitCost, 0),
    [editItems]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
                    No purchase orders found. Click &quot;Create Purchase Order&quot; to make your first draft.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => {
                  const supplier = supplierMap.get(po.supplierId);
                  const payInfo = derivePoPaymentStatus(po);
                  const canEdit = po.status !== 'cancelled';

                  return (
                    <tr key={po.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-4 font-bold text-white">
                        {po.poNumber}
                        {po.supplierInvoiceRef && (
                          <span className="block text-[10px] text-gray-500 font-normal">
                            Inv: {po.supplierInvoiceRef}
                          </span>
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
                          {/* View details */}
                          <button
                            onClick={() => setSelectedPoForDetail(po)}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Edit PO lines */}
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(po)}
                              className="p-1.5 bg-orange-500/10 hover:bg-accentOrange text-accentOrange hover:text-white border border-accentOrange/30 rounded-lg transition"
                              title="Edit Order Lines"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Place PO */}
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handlePlacePo(po.id)}
                              className="px-2.5 py-1 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 rounded-lg text-[10px] font-bold transition"
                            >
                              Place PO
                            </button>
                          )}

                          {/* Record payment */}
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

      {/* ======================================================
          CREATE PO MODAL
      ====================================================== */}
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

              {/* Line Entry */}
              <div className="border border-gray-800 rounded-2xl p-4 bg-black/40 space-y-4">
                <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider">
                  Add Products
                </h4>
                <p className="text-[11px] text-gray-500">
                  Search for an existing product or type any name to add a new one. Set qty &amp; cost, then click <strong className="text-accentOrange">Add</strong>.
                </p>

                <LineEntryRow products={products} onAdd={handleAddToDraft} />

                {/* Items list */}
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                  {poItems.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 italic py-4">
                      No items added yet.
                    </p>
                  ) : (
                    poItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-800/80 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{item.productName}</span>
                          {!item.productId && (
                            <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">NEW</span>
                          )}
                          <span className="text-gray-400 ml-2">x{item.qtyOrdered} @ KES {item.unitCost}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-accentOrange">
                            KES {(item.qtyOrdered * item.unitCost).toLocaleString()}
                          </span>
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

      {/* ======================================================
          EDIT PO MODAL
      ====================================================== */}
      {editingPo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-accentOrange" />
                  Edit Order Lines &mdash; {editingPo.poNumber}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {supplierMap.get(editingPo.supplierId)?.name || 'Unknown Supplier'}
                  &nbsp;&middot;&nbsp;
                  <span className={`font-bold uppercase ${
                    editingPo.status === 'draft' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {editingPo.status}
                  </span>
                </p>
              </div>
              <button onClick={() => setEditingPo(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">

              {/* Add new line */}
              <div className="border border-gray-800 rounded-2xl p-4 bg-black/40 space-y-4">
                <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider">
                  Add a Product
                </h4>
                <p className="text-[11px] text-gray-500">
                  Search an existing product or type a name for a new one. Set qty &amp; cost, then click <strong className="text-accentOrange">Add</strong>.
                </p>
                <LineEntryRow products={products} onAdd={handleAddToEdit} />
              </div>

              {/* Current lines list */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">
                  Current Order Lines
                </h4>

                {editItems.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 italic py-6">No lines on this order.</p>
                ) : (
                  editItems.map((line, idx) => {
                    const isMarkedDelete = line.toDelete;
                    const receivedSome = line.qtyReceived > 0;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl flex justify-between items-center text-xs transition ${
                          isMarkedDelete
                            ? 'bg-red-900/20 border border-red-800/40 opacity-50'
                            : line.isNew
                            ? 'bg-green-900/20 border border-green-800/40'
                            : 'bg-gray-800/80'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold ${isMarkedDelete ? 'line-through text-gray-500' : 'text-white'}`}>
                              {line.productName}
                            </span>
                            {!line.productId && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                                NEW
                              </span>
                            )}
                            {line.isNew && !isMarkedDelete && (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">
                                ADDING
                              </span>
                            )}
                            {isMarkedDelete && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                                REMOVING
                              </span>
                            )}
                          </div>
                          <span className="text-gray-400 mt-0.5 block">
                            x{line.qtyOrdered} @ KES {line.unitCost}
                            {receivedSome && (
                              <span className="ml-2 text-blue-400">
                                ({line.qtyReceived} already received)
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="font-black text-accentOrange">
                            KES {(line.qtyOrdered * line.unitCost).toLocaleString()}
                          </span>
                          {!isMarkedDelete ? (
                            <button
                              type="button"
                              onClick={() => handleToggleDeleteEditLine(idx)}
                              className={`p-1 rounded-lg transition ${
                                receivedSome
                                  ? 'text-gray-600 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                              }`}
                              title={receivedSome ? 'Cannot remove — goods already received' : 'Remove line'}
                              disabled={receivedSome}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleDeleteEditLine(idx)}
                              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
                              title="Undo remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-800 text-xs font-bold text-white">
                <span>Revised Total:</span>
                <span className="text-lg text-accentOrange italic font-black">
                  KES {editTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditingPo(null); setEditItems([]); }}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-700 transition"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleEditPoSave}
                disabled={editSaving}
                className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl text-xs hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          RECORD PAYMENT MODAL
      ====================================================== */}
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
