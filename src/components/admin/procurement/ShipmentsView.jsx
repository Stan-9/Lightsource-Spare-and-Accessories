import { useState, useMemo } from 'react';
import { Truck, Plus, Calendar, Clock, AlertTriangle, CheckCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createShipment, updateShipmentEta } from '../../../services/procurement/procurementService';
import { isShipmentOverdue, isShipmentDelayed, getLineOutstanding } from '../../../services/procurement/procurementUtils';

const ShipmentsView = ({
  carriers,
  shipments,
  purchaseOrders,
  purchaseLines,
  onOpenReceiving,
}) => {
  const [filterStatus, setFilterStatus] = useState('in_transit');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEtaModalOpen, setIsEtaModalOpen] = useState(false);
  const [selectedShipmentForEta, setSelectedShipmentForEta] = useState(null);

  // New Shipment Form State
  const [carrierId, setCarrierId] = useState('');
  const [waybillRef, setWaybillRef] = useState('');
  const [handedOverDate, setHandedOverDate] = useState('');
  const [etaOriginal, setEtaOriginal] = useState('');
  const [cargoCostKES, setCargoCostKES] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLineIds, setSelectedLineIds] = useState([]);

  // ETA update modal state
  const [newEta, setNewEta] = useState('');
  const [delayReason, setDelayReason] = useState('customs');
  const [delayReasonCustom, setDelayReasonCustom] = useState('');

  const carrierMap = useMemo(() => new Map(carriers.map(c => [c.id, c])), [carriers]);
  const poMap = useMemo(() => new Map(purchaseOrders.map(p => [p.id, p])), [purchaseOrders]);

  // Open lines available for assignment (placed POs, no shipment assigned, outstanding > 0)
  const availableLines = useMemo(() => {
    return purchaseLines.filter(l => {
      if (l.shipmentId) return false;
      const po = poMap.get(l.poId);
      if (!po || po.status !== 'placed') return false;
      return getLineOutstanding(l) > 0;
    });
  }, [purchaseLines, poMap]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [shipments, filterStatus]);

  const handleToggleLineSelection = (lineId) => {
    if (selectedLineIds.includes(lineId)) {
      setSelectedLineIds(selectedLineIds.filter(id => id !== lineId));
    } else {
      setSelectedLineIds([...selectedLineIds, lineId]);
    }
  };

  const handleCreateShipmentSubmit = async (e) => {
    e.preventDefault();
    if (!carrierId) {
      toast.error('Please select a cargo carrier');
      return;
    }
    if (!etaOriginal) {
      toast.error('Please enter the initial ETA date');
      return;
    }
    if (selectedLineIds.length === 0) {
      toast.error('Select at least one product line for this shipment');
      return;
    }

    try {
      const res = await createShipment(
        {
          carrierId,
          reference: waybillRef.trim(),
          handedOverDate,
          etaOriginal,
          cargoCostKES: Number(cargoCostKES || 0),
          notes: notes.trim(),
        },
        selectedLineIds
      );

      if (res && res.success) {
        toast.success('Cargo shipment created successfully!');
        setIsCreateModalOpen(false);
        setSelectedLineIds([]);
        setCarrierId('');
        setWaybillRef('');
        setCargoCostKES('');
      } else {
        toast.error(res?.error || 'Failed to create shipment');
      }
    } catch {
      toast.error('Failed to create shipment');
    }
  };

  const handleUpdateEtaSubmit = async (e) => {
    e.preventDefault();
    if (!newEta) {
      toast.error('Please select the new ETA date');
      return;
    }
    const finalReason = delayReason === 'other' ? delayReasonCustom.trim() : delayReason;
    if (!finalReason) {
      toast.error('Please enter a delay reason');
      return;
    }

    try {
      const res = await updateShipmentEta(selectedShipmentForEta.id, newEta, finalReason);
      if (res && res.success) {
        toast.success('Shipment ETA updated!');
        setIsEtaModalOpen(false);
        setSelectedShipmentForEta(null);
      } else {
        toast.error(res?.error || 'Failed to update ETA');
      }
    } catch {
      toast.error('Failed to update ETA');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accentOrange"
          >
            <option value="in_transit">In Transit</option>
            <option value="received">Received / Arrived</option>
            <option value="all">All Shipments</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto bg-accentOrange hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Create Cargo Shipment
        </button>
      </div>

      {/* Shipments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShipments.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl text-xs italic">
            No cargo shipments found in this view.
          </div>
        ) : (
          filteredShipments.map(shipment => {
            const carrier = carrierMap.get(shipment.carrierId);
            const isOverdue = isShipmentOverdue(shipment);
            const isDelayed = isShipmentDelayed(shipment);
            const linesInShipment = purchaseLines.filter(l => l.shipmentId === shipment.id);

            return (
              <div key={shipment.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-400" />
                        {carrier?.name || 'Cargo Carrier'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">Waybill / Ref: <span className="text-white font-mono">{shipment.reference || 'N/A'}</span></p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      shipment.status === 'received' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      isOverdue ? 'bg-red-500/10 text-red-500 border border-red-500/30 animate-pulse' :
                      isDelayed ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {shipment.status === 'received' ? 'Received' : (isOverdue ? 'Overdue' : (isDelayed ? 'Delayed' : 'In Transit'))}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Current ETA</span>
                      <span className={`font-bold ${isOverdue ? 'text-red-400' : 'text-white'}`}>{shipment.etaCurrent || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Cargo Fee</span>
                      <span className="font-bold text-accentOrange">KES {Number(shipment.cargoCostKES || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* ETA History Log preview if delayed */}
                  {shipment.etaHistory && shipment.etaHistory.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] text-amber-300">
                      <span className="font-bold">Delay Log:</span> Pushed to {shipment.etaCurrent} ({shipment.etaHistory[shipment.etaHistory.length - 1].reason})
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3 font-bold">
                    Contains {linesInShipment.length} product lines
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                  {shipment.status === 'in_transit' && (
                    <>
                      <button
                        onClick={() => { setSelectedShipmentForEta(shipment); setNewEta(shipment.etaCurrent); setIsEtaModalOpen(true); }}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition"
                      >
                        Update ETA
                      </button>

                      <button
                        onClick={() => onOpenReceiving(shipment)}
                        className="px-4 py-1.5 bg-accentOrange hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition shadow-lg"
                      >
                        Receive Cargo
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Shipment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-accentOrange" />
                Create Cargo Shipment
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateShipmentSubmit} className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-2">Carrier *</label>
                  <select
                    required
                    value={carrierId}
                    onChange={e => setCarrierId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                  >
                    <option value="">Select Shipping Carrier</option>
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-2">Waybill / Tracking Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. WB-99201"
                    value={waybillRef}
                    onChange={e => setWaybillRef(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-2">Carrier Initial ETA *</label>
                  <input
                    type="date"
                    required
                    value={etaOriginal}
                    onChange={e => setEtaOriginal(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-2">Cargo Freight Fee KES (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={cargoCostKES}
                    onChange={e => setCargoCostKES(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                  />
                </div>
              </div>

              {/* Select PO lines to include */}
              <div className="border border-gray-800 rounded-2xl p-4 bg-black/40 space-y-3">
                <h4 className="font-bold text-gray-300 uppercase tracking-wider">Select PO Lines to Include in Cargo</h4>
                
                {availableLines.length === 0 ? (
                  <p className="text-gray-500 italic py-3 text-center">No open PO lines available to ship.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableLines.map(line => {
                      const po = poMap.get(line.poId);
                      const isSelected = selectedLineIds.includes(line.id);
                      return (
                        <div
                          key={line.id}
                          onClick={() => handleToggleLineSelection(line.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-accentOrange/10 border-accentOrange text-white' : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{line.pendingProduct?.name || 'Product ID: ' + line.productId}</p>
                            <p className="text-[10px] text-gray-400">PO: {po?.poNumber || 'Draft'} · Qty: {getLineOutstanding(line)}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-accentOrange border-accentOrange text-white' : 'border-gray-600'}`}>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl hover:bg-orange-600 transition"
                >
                  Create Shipment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Update ETA Modal */}
      {isEtaModalOpen && selectedShipmentForEta && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Update Shipment ETA</h3>
              <button onClick={() => setIsEtaModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEtaSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">New ETA Date *</label>
                <input
                  type="date"
                  required
                  value={newEta}
                  onChange={e => setNewEta(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Delay Reason Preset *</label>
                <select
                  value={delayReason}
                  onChange={e => setDelayReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                >
                  <option value="customs">Customs Hold / Inspection</option>
                  <option value="carrier_backlog">Carrier Backlog</option>
                  <option value="transport_weather">Transport / Weather Delay</option>
                  <option value="supplier_delay">Supplier Handover Delay</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>

              {delayReason === 'other' && (
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Specify Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason details..."
                    value={delayReasonCustom}
                    onChange={e => setDelayReasonCustom(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEtaModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl"
                >
                  Save Delay Reason
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShipmentsView;
