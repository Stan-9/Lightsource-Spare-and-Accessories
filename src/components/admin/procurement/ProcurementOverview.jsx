import { useMemo } from 'react';
import { Truck, Package, Clock, AlertTriangle, DollarSign, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import {
  deriveLineStatus,
  isLineOverdue,
  isShipmentOverdue,
  getLineOutstanding,
  isProductSellable,
} from '../../../services/procurement/procurementUtils';

const ProcurementOverview = ({
  suppliers,
  carriers,
  purchaseOrders,
  purchaseLines,
  shipments,
  receipts,
  products,
  onNavigateTab,
  onOpenReceiving,
  onOpenPricing,
}) => {
  // Derive overall metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const shipmentMap = new Map(shipments.map(s => [s.id, s]));
    const poMap = new Map(purchaseOrders.map(p => [p.id, p]));

    let valueInTransit = 0;
    let valueAwaitingDispatch = 0;
    let valuePaidNotDelivered = 0;
    let overdueCount = 0;

    const shortLines = [];
    const arrivingSoonShipments = [];

    purchaseLines.forEach(line => {
      const shp = line.shipmentId ? shipmentMap.get(line.shipmentId) : null;
      const po = line.poId ? poMap.get(line.poId) : null;
      const status = deriveLineStatus(line, shp);
      const outstanding = getLineOutstanding(line);
      const unitCost = Number(line.unitCostKES || line.unitCost || 0);
      const lineVal = outstanding * unitCost;

      if (status === 'in_transit') {
        valueInTransit += lineVal;
      } else if (status === 'awaiting_dispatch') {
        valueAwaitingDispatch += lineVal;
      } else if (status === 'short') {
        valuePaidNotDelivered += lineVal;
        shortLines.push({ ...line, po, shp, outstanding, lineVal });
      }

      if (isLineOverdue(line, po, shp, today)) {
        overdueCount++;
      }
    });

    // Shipments arriving in next 7 days
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    shipments.forEach(shp => {
      if (shp.status === 'in_transit' && shp.etaCurrent && shp.etaCurrent >= today && shp.etaCurrent <= next7Days) {
        arrivingSoonShipments.push(shp);
      }
    });

    // Unpriced products queue
    const unpricedProducts = products.filter(p => !isProductSellable(p) && (p.buyingPrice || 0) > 0);

    return {
      valueInTransit,
      valueAwaitingDispatch,
      valuePaidNotDelivered,
      overdueCount,
      shortLines,
      arrivingSoonShipments,
      unpricedProducts,
    };
  }, [purchaseOrders, purchaseLines, shipments, products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Value in Transit */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Value In Transit</p>
              <h3 className="text-2xl font-black text-white mt-1">
                KES {metrics.valueInTransit.toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Cargo currently on shipping carriers</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Awaiting Dispatch */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Awaiting Cargo</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">
                KES {metrics.valueAwaitingDispatch.toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Ordered, not yet with cargo carrier</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Paid Not Delivered (Shortage) */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Paid / Undelivered</p>
              <h3 className="text-2xl font-black text-red-400 mt-1">
                KES {metrics.valuePaidNotDelivered.toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Capital tied in short/missing goods</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Overdue Count */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Overdue Items</p>
              <h3 className={`text-2xl font-black mt-1 ${metrics.overdueCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {metrics.overdueCount} Lines
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">ETA or expected dispatch date passed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Action Queues Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Needs Pricing Queue Widget */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accentOrange" />
                Needs Pricing Queue ({metrics.unpricedProducts.length})
              </h4>
              <button
                onClick={() => onNavigateTab('pricing')}
                className="text-xs text-accentOrange hover:underline font-bold"
              >
                View Queue →
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Newly received inventory items awaiting catalog pricing before they can be sold in-shop or online.
            </p>

            {metrics.unpricedProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl text-xs italic">
                All received products have valid selling prices!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {metrics.unpricedProducts.slice(0, 4).map(p => (
                  <div key={p.id} className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white truncate max-w-[200px]">{p.name}</p>
                      <p className="text-[10px] text-gray-400">Landed Cost: KES {p.buyingPrice?.toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 font-bold rounded text-[10px]">
                      Needs Price
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Arriving Soon Shipments */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Arriving Next 7 Days ({metrics.arrivingSoonShipments.length})
              </h4>
              <button
                onClick={() => onNavigateTab('shipments')}
                className="text-xs text-blue-400 hover:underline font-bold"
              >
                View Shipments →
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Cargo shipments with ETA within the next 7 calendar days.
            </p>

            {metrics.arrivingSoonShipments.length === 0 ? (
              <div className="p-6 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl text-xs italic">
                No cargo shipments arriving in the next 7 days.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {metrics.arrivingSoonShipments.map(s => {
                  const carrier = carriers.find(c => c.id === s.carrierId);
                  return (
                    <div key={s.id} className="bg-gray-800/50 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{carrier?.name || 'Carrier'} · Ref: {s.reference || 'N/A'}</p>
                        <p className="text-[10px] text-gray-400">ETA: <span className="text-blue-400 font-bold">{s.etaCurrent}</span></p>
                      </div>
                      <button
                        onClick={() => onOpenReceiving(s)}
                        className="px-3 py-1.5 bg-accentOrange text-white font-bold rounded-lg hover:bg-orange-600 transition"
                      >
                        Receive Cargo
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProcurementOverview;
