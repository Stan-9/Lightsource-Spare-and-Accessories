import { useState } from 'react';
import { LayoutDashboard, FileText, Truck, Users, DollarSign } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import ProcurementOverview from '../../components/admin/procurement/ProcurementOverview';
import PurchaseOrdersView from '../../components/admin/procurement/PurchaseOrdersView';
import ShipmentsView from '../../components/admin/procurement/ShipmentsView';
import ReceivingView from '../../components/admin/procurement/ReceivingView';
import SuppliersCarriersView from '../../components/admin/procurement/SuppliersCarriersView';
import NeedsPricingView from '../../components/admin/procurement/NeedsPricingView';
import { isProductSellable } from '../../services/procurement/procurementUtils';

const ProcurementTab = ({ products }) => {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview | orders | shipments | suppliers | pricing
  const [activeReceivingShipment, setActiveReceivingShipment] = useState(null);

  const {
    suppliers,
    carriers,
    purchaseOrders,
    purchaseLines,
    shipments,
    receipts,
    loading,
  } = useProcurement();

  const unpricedCount = products.filter(p => !isProductSellable(p) && (p.buyingPrice || 0) > 0).length;

  const handleOpenReceiving = (shipment) => {
    setActiveReceivingShipment(shipment);
  };

  const handleCloseReceiving = () => {
    setActiveReceivingShipment(null);
  };

  const handleReceiptPosted = () => {
    setActiveReceivingShipment(null);
    setActiveSubTab('pricing'); // Redirect to pricing queue after receiving
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-4 border-accentOrange border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading Procurement Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Tab Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Procurement Tracking
            <Truck className="w-7 h-7 text-accentOrange" />
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Suppliers · Purchase Orders · Cargo Shipments · Landed Cost Receiving
          </p>
        </div>

        {/* Sub-Nav Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl">
          <button
            onClick={() => { setActiveSubTab('overview'); handleCloseReceiving(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'overview' && !activeReceivingShipment ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>

          <button
            onClick={() => { setActiveSubTab('orders'); handleCloseReceiving(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'orders' ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Purchase Orders ({purchaseOrders.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('shipments'); handleCloseReceiving(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'shipments' ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            Cargo Shipments ({shipments.filter(s => s.status === 'in_transit').length})
          </button>

          <button
            onClick={() => { setActiveSubTab('suppliers'); handleCloseReceiving(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'suppliers' ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Suppliers & Carriers
          </button>

          <button
            onClick={() => { setActiveSubTab('pricing'); handleCloseReceiving(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'pricing' ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Needs Pricing
            {unpricedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black">
                {unpricedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Procurement Workspace */}
      {activeReceivingShipment ? (
        <ReceivingView
          shipment={activeReceivingShipment}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          purchaseLines={purchaseLines}
          products={products}
          onClose={handleCloseReceiving}
          onReceiptPosted={handleReceiptPosted}
        />
      ) : (
        <>
          {activeSubTab === 'overview' && (
            <ProcurementOverview
              suppliers={suppliers}
              carriers={carriers}
              purchaseOrders={purchaseOrders}
              purchaseLines={purchaseLines}
              shipments={shipments}
              receipts={receipts}
              products={products}
              onNavigateTab={setActiveSubTab}
              onOpenReceiving={handleOpenReceiving}
              onOpenPricing={() => setActiveSubTab('pricing')}
            />
          )}

          {activeSubTab === 'orders' && (
            <PurchaseOrdersView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              purchaseLines={purchaseLines}
              products={products}
            />
          )}

          {activeSubTab === 'shipments' && (
            <ShipmentsView
              carriers={carriers}
              shipments={shipments}
              purchaseOrders={purchaseOrders}
              purchaseLines={purchaseLines}
              onOpenReceiving={handleOpenReceiving}
            />
          )}

          {activeSubTab === 'suppliers' && (
            <SuppliersCarriersView
              suppliers={suppliers}
              carriers={carriers}
              purchaseOrders={purchaseOrders}
              shipments={shipments}
            />
          )}

          {activeSubTab === 'pricing' && (
            <NeedsPricingView
              products={products}
            />
          )}
        </>
      )}

    </div>
  );
};

export default ProcurementTab;
