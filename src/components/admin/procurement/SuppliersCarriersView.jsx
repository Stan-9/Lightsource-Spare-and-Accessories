import { useState } from 'react';
import { Users, Truck, Plus, Phone, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { addSupplier, updateSupplier, addCarrier, updateCarrier } from '../../../services/procurement/procurementService';

const SuppliersCarriersView = ({
  suppliers,
  carriers,
  purchaseOrders,
  shipments,
}) => {
  const [activeTab, setActiveTab] = useState('suppliers'); // suppliers | carriers

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supLocation, setSupLocation] = useState('');

  // Carrier modal
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [carName, setCarName] = useState('');
  const [carPhone, setCarPhone] = useState('');

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supName.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    try {
      const res = await addSupplier({
        name: supName,
        phone: supPhone,
        location: supLocation,
      });
      if (res && res.success) {
        toast.success('Supplier added!');
        setIsSupplierModalOpen(false);
        setSupName('');
        setSupPhone('');
        setSupLocation('');
      } else {
        toast.error(res?.error || 'Failed to add supplier');
      }
    } catch {
      toast.error('Failed to add supplier');
    }
  };

  const handleCarrierSubmit = async (e) => {
    e.preventDefault();
    if (!carName.trim()) {
      toast.error('Carrier name is required');
      return;
    }
    try {
      const res = await addCarrier({
        name: carName,
        phone: carPhone,
      });
      if (res && res.success) {
        toast.success('Cargo Carrier added!');
        setIsCarrierModalOpen(false);
        setCarName('');
        setCarPhone('');
      } else {
        toast.error(res?.error || 'Failed to add carrier');
      }
    } catch {
      toast.error('Failed to add carrier');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs">
      
      {/* Sub Tabs */}
      <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-2 rounded-2xl">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'suppliers' ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Suppliers ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveTab('carriers')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'carriers' ? 'bg-accentOrange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            Cargo Carriers ({carriers.length})
          </button>
        </div>

        {activeTab === 'suppliers' ? (
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="bg-accentOrange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        ) : (
          <button
            onClick={() => setIsCarrierModalOpen(true)}
            className="bg-accentOrange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Carrier
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'suppliers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="lg:col-span-3 p-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl italic">
              No suppliers added yet. Click "Add Supplier" to create your first supplier contact.
            </div>
          ) : (
            suppliers.map(s => {
              const activePos = purchaseOrders.filter(p => p.supplierId === s.id && p.status === 'placed');
              return (
                <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-base">{s.name}</h4>
                  <div className="space-y-1.5 text-gray-400">
                    {s.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-accentOrange" /> {s.phone}</p>}
                    {s.location && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-green-400" /> {s.location}</p>}
                  </div>
                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Active Orders</span>
                    <span className="font-black text-accentOrange">{activePos.length} Placed POs</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carriers.length === 0 ? (
            <div className="lg:col-span-3 p-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl italic">
              No cargo carriers added yet. Click "Add Carrier" to add shipping partners.
            </div>
          ) : (
            carriers.map(c => {
              const activeShps = shipments.filter(shp => shp.carrierId === c.id && shp.status === 'in_transit');
              return (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-400" />
                    {c.name}
                  </h4>
                  {c.phone && <p className="text-gray-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-accentOrange" /> {c.phone}</p>}
                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Active Cargo</span>
                    <span className="font-black text-blue-400">{activeShps.length} In-Transit</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Add Supplier</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guangzhou Motor Spares Co."
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+86..."
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="Guangzhou, China"
                  value={supLocation}
                  onChange={e => setSupLocation(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Carrier Modal */}
      {isCarrierModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Add Cargo Carrier</h3>
              <button onClick={() => setIsCarrierModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCarrierSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Carrier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rolling Cargo / Salama Express"
                  value={carName}
                  onChange={e => setCarName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="07..."
                  value={carPhone}
                  onChange={e => setCarPhone(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCarrierModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accentOrange text-white font-bold rounded-xl"
                >
                  Save Carrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuppliersCarriersView;
