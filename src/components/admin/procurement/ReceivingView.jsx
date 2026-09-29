import { useState, useMemo } from 'react';
import { PackageCheck, CheckCircle2, AlertTriangle, Plus, DollarSign, ArrowRight, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { postReceipt } from '../../../services/procurement/procurementService';
import { calculateFreightAllocation, computeWeightedAverageCost, getLineOutstanding } from '../../../services/procurement/procurementUtils';

const ReceivingView = ({
  shipment,
  suppliers,
  purchaseOrders,
  purchaseLines,
  products,
  onClose,
  onReceiptPosted,
}) => {
  const [cargoCostKES, setCargoCostKES] = useState(shipment?.cargoCostKES || 0);
  const [freightBasis, setFreightBasis] = useState('value');
  const [notes, setNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter lines belonging to this shipment or open for receiving
  const initialReceivingLines = useMemo(() => {
    const lines = purchaseLines.filter(l => l.shipmentId === shipment?.id);
    const productMap = new Map(products.map(p => [p.id, p]));
    const poMap = new Map(purchaseOrders.map(po => [po.id, po]));

    return lines.map(line => {
      const product = line.productId ? productMap.get(line.productId) : null;
      const po = poMap.get(line.poId);
      const outstanding = getLineOutstanding(line);

      return {
        id: line.id,
        purchaseLineId: line.id,
        productId: line.productId || null,
        productName: product?.name || line.pendingProduct?.name || 'Product',
        unitCostKES: Number(line.unitCostKES || line.unitCost || 0),
        qtyExpected: outstanding,
        qtyGood: '', // Empty by default per §5.3 Rule 3 (no rubber-stamping)
        qtyDamaged: 0,
        unexpected: false,
        poNumber: po?.poNumber || '',
        supplierInvoiceRef: po?.supplierInvoiceRef || '',
      };
    });
  }, [shipment, purchaseLines, products, purchaseOrders]);

  const [receivingLines, setReceivingLines] = useState(initialReceivingLines);

  // Unexpected item modal
  const [isUnexpectedModalOpen, setIsUnexpectedModalOpen] = useState(false);
  const [unexpSearch, setUnexpSearch] = useState('');
  const [unexpQty, setUnexpQty] = useState(1);

  const handleQtyGoodChange = (lineId, val) => {
    setReceivingLines(receivingLines.map(l => l.id === lineId ? { ...l, qtyGood: val } : l));
  };

  const handleQtyDamagedChange = (lineId, val) => {
    setReceivingLines(receivingLines.map(l => l.id === lineId ? { ...l, qtyDamaged: Number(val) || 0 } : l));
  };

  const handleReceivedInFull = (lineId) => {
    setReceivingLines(receivingLines.map(l => l.id === lineId ? { ...l, qtyGood: l.qtyExpected, qtyDamaged: 0 } : l));
  };

  const handleGroupReceivedInFull = (poNumber) => {
    setReceivingLines(receivingLines.map(l => l.poNumber === poNumber ? { ...l, qtyGood: l.qtyExpected, qtyDamaged: 0 } : l));
  };

  const handleAddUnexpectedItem = (product) => {
    const newUnexpLine = {
      id: 'unexp_' + Date.now(),
      purchaseLineId: null,
      productId: product.id,
      productName: product.name,
      unitCostKES: Number(product.buyingPrice || product.price || 0),
      qtyExpected: 0,
      qtyGood: Number(unexpQty) || 1,
      qtyDamaged: 0,
      unexpected: true,
      poNumber: 'UNEXPECTED',
      supplierInvoiceRef: 'N/A',
    };
    setReceivingLines([...receivingLines, newUnexpLine]);
    setIsUnexpectedModalOpen(false);
    setUnexpSearch('');
    setUnexpQty(1);
    toast.success(`Added unexpected item "${product.name}"`);
  };

  // Group lines by PO / Invoice Ref for clear verification
  const groupedLines = useMemo(() => {
    const groups = {};
    receivingLines.forEach(l => {
      const key = l.poNumber || 'DIRECT';
      if (!groups[key]) groups[key] = { poNumber: key, invoiceRef: l.supplierInvoiceRef, lines: [] };
      groups[key].lines.push(l);
    });
    return Object.values(groups);
  }, [receivingLines]);

  // Freight calculation preview
  const freightAllocMap = useMemo(() => {
    return calculateFreightAllocation(
      receivingLines.map(l => ({
        id: l.id,
        qtyGood: Number(l.qtyGood || 0),
        unitCostKES: l.unitCostKES,
      })),
      cargoCostKES,
      freightBasis
    );
  }, [receivingLines, cargoCostKES, freightBasis]);

  const handleProceedToReview = () => {
    // Validate that at least one line has good qty entered
    const hasEnteredGood = receivingLines.some(l => l.qtyGood !== '' && Number(l.qtyGood) >= 0);
    if (!hasEnteredGood) {
      toast.error('Please enter received quantities for the lines before reviewing');
      return;
    }
    setIsReviewing(true);
  };

  const handlePostReceiptSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedLines = receivingLines.map(l => ({
        ...l,
        qtyGood: Number(l.qtyGood || 0),
        qtyDamaged: Number(l.qtyDamaged || 0),
      }));

      const res = await postReceipt(
        {
          shipmentId: shipment?.id || null,
          cargoCostKES: Number(cargoCostKES || 0),
          freightBasis,
          notes,
        },
        formattedLines
      );

      if (res && res.success) {
        toast.success('Cargo receipt posted successfully! Inventory and landed costs updated.');
        onReceiptPosted();
      } else {
        toast.error(res?.error || 'Failed to post receipt');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to post receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unexpFilteredProducts = useMemo(() => {
    if (!unexpSearch.trim()) return [];
    return products.filter(p => p.name.toLowerCase().includes(unexpSearch.toLowerCase())).slice(0, 5);
  }, [products, unexpSearch]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 text-xs animate-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-accentOrange" />
            {isReviewing ? 'Review & Post Cargo Receipt' : 'Receiving & Invoice Check'}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {shipment ? `Shipment Ref: ${shipment.reference || 'N/A'}` : 'Direct Delivery'}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!isReviewing ? (
        /* STEP 1: Quantities & Invoice Check */
        <div className="space-y-6">

          {/* Freight Config Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800/40 p-4 rounded-2xl border border-gray-800">
            <div>
              <label className="block text-gray-400 font-bold mb-1">Cargo Freight Fee (KES) *</label>
              <input
                type="number"
                value={cargoCostKES}
                onChange={e => setCargoCostKES(e.target.value)}
                placeholder="Enter cargo fee..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-bold mb-1">Freight Allocation Basis</label>
              <select
                value={freightBasis}
                onChange={e => setFreightBasis(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-white font-bold"
              >
                <option value="value">By Value (Proportional to KES cost)</option>
                <option value="quantity">By Quantity (Equal per unit)</option>
              </select>
            </div>
          </div>

          {/* Expected vs Actual Lines Grouped by PO */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-200 text-sm">Expected Lines vs Delivered</h4>
              <button
                onClick={() => setIsUnexpectedModalOpen(true)}
                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded-xl font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Unexpected Item
              </button>
            </div>

            {groupedLines.map(group => (
              <div key={group.poNumber} className="border border-gray-800 rounded-2xl bg-black/30 overflow-hidden">
                <div className="bg-gray-800/80 p-3 flex justify-between items-center border-b border-gray-800">
                  <div>
                    <span className="font-bold text-white text-xs">{group.poNumber}</span>
                    {group.invoiceRef && <span className="ml-3 text-[10px] text-accentOrange font-bold">Inv: {group.invoiceRef}</span>}
                  </div>
                  <button
                    onClick={() => handleGroupReceivedInFull(group.poNumber)}
                    className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white px-2.5 py-1 rounded-lg font-bold transition"
                  >
                    Mark Group Received in Full
                  </button>
                </div>

                <div className="divide-y divide-gray-800/50">
                  {group.lines.map(line => (
                    <div key={line.id} className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:bg-gray-800/20">
                      <div className="sm:col-span-5">
                        <p className="font-bold text-white">{line.productName}</p>
                        <p className="text-[10px] text-gray-400">
                          Unit Cost: KES {line.unitCostKES.toLocaleString()} · Expected: <span className="text-white font-bold">{line.qtyExpected}</span>
                        </p>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Good Units</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Empty"
                          value={line.qtyGood}
                          onChange={e => handleQtyGoodChange(line.id, e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[9px] text-red-400 uppercase font-bold mb-1">Damaged Units</label>
                        <input
                          type="number"
                          min="0"
                          value={line.qtyDamaged}
                          onChange={e => handleQtyDamagedChange(line.id, e.target.value)}
                          className="w-full bg-gray-900 border border-red-500/30 rounded-lg p-2 text-red-400 font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleReceivedInFull(line.id)}
                          className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-bold transition"
                        >
                          Full
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold">
              Cancel
            </button>
            <button
              onClick={handleProceedToReview}
              className="px-6 py-2.5 bg-accentOrange text-white font-bold rounded-xl hover:bg-orange-600 transition flex items-center gap-2"
            >
              Review & Landed Cost Preview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      ) : (
        /* STEP 2: Review Screen & Landed Cost Calculation */
        <div className="space-y-6">

          <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-800 space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Landed Cost Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
              <div>
                <span className="text-gray-400 text-[10px] block">Cargo Freight</span>
                <span className="font-black text-accentOrange">KES {Number(cargoCostKES || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] block">Allocation Basis</span>
                <span className="font-bold text-white uppercase">{freightBasis}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] block">Lines to Receive</span>
                <span className="font-bold text-white">{receivingLines.filter(l => Number(l.qtyGood) > 0).length}</span>
              </div>
            </div>
          </div>

          {/* Landed Cost & Stock Update Table */}
          <div className="border border-gray-800 rounded-2xl overflow-hidden bg-black/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-800/80 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-center">Good Qty</th>
                  <th className="p-3 text-right">Supplier Cost</th>
                  <th className="p-3 text-right">Freight Alloc</th>
                  <th className="p-3 text-right">Landed Unit Cost</th>
                  <th className="p-3 text-right">New Avg Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {receivingLines.map(line => {
                  const alloc = freightAllocMap.get(line.id) || { freightAllocKES: 0, landedUnitCostKES: line.unitCostKES };
                  const qtyGood = Number(line.qtyGood || 0);
                  const prod = products.find(p => p.id === line.productId);
                  const newAvg = computeWeightedAverageCost(prod?.stock || 0, prod?.buyingPrice || 0, qtyGood, alloc.landedUnitCostKES);

                  return (
                    <tr key={line.id} className="hover:bg-gray-800/30">
                      <td className="p-3 font-bold text-white">
                        {line.productName}
                        {line.unexpected && <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded font-bold">UNEXPECTED</span>}
                      </td>
                      <td className="p-3 text-center font-bold">{qtyGood}</td>
                      <td className="p-3 text-right text-gray-300">KES {line.unitCostKES.toLocaleString()}</td>
                      <td className="p-3 text-right text-accentOrange">KES {alloc.freightAllocKES.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-white">KES {alloc.landedUnitCostKES.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-green-400">KES {newAvg.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <button
              onClick={() => setIsReviewing(false)}
              className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold"
            >
              ← Back to Quantities
            </button>
            
            <button
              onClick={handlePostReceiptSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-accentOrange hover:bg-orange-600 disabled:bg-gray-800 text-white font-black rounded-xl shadow-xl transition transform active:scale-95"
            >
              {isSubmitting ? 'Posting Receipt & Updating Inventory...' : 'Post Official Cargo Receipt'}
            </button>
          </div>

        </div>
      )}

      {/* Add Unexpected Item Modal */}
      {isUnexpectedModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-base">Add Unexpected Item</h4>
              <button onClick={() => setIsUnexpectedModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search catalog product..."
                value={unexpSearch}
                onChange={e => setUnexpSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
              />

              <div className="space-y-2">
                {unexpFilteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddUnexpectedItem(p)}
                    className="w-full p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-xl text-left flex justify-between items-center text-xs"
                  >
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-accentOrange font-bold">+ Select</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceivingView;
