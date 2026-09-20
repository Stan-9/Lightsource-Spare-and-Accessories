import { Tags, Trash2, Settings } from 'lucide-react';
import MigrationPanel from './MigrationPanel';

/**
 * SettingsTab Component
 * Form for shop configuration (name, numbers, paybill), product categories management, and database migration.
 */
const SettingsTab = ({
  settingsData,
  setSettingsData,
  categories,
  newCategoryName,
  setNewCategoryName,
  handleSaveSettings,
  handleAddCategory,
  handleDeleteCategory,
  orders,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Store Settings</h2>

      <form onSubmit={handleSaveSettings} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Display Shop Name</label>
          <input
            type="text"
            value={settingsData.shopName}
            onChange={(e) => setSettingsData({ ...settingsData, shopName: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition-all font-medium"
            placeholder="e.g. LightSource Motors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp Number</label>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Include the country code without the '+' sign. For Example: <span className="text-gray-300 font-mono">254712345678</span>.
            Customer orders will be sent here directly.
          </p>
          <input
            type="text"
            value={settingsData.whatsappNumber || ''}
            onChange={(e) => setSettingsData({ ...settingsData, whatsappNumber: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition-all font-mono"
            placeholder="254700000000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Receipt Contact Phone Numbers</label>
          <input
            type="text"
            value={settingsData.contactNumber || ''}
            onChange={(e) => setSettingsData({ ...settingsData, contactNumber: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition-all font-medium"
            placeholder="0728490713 / 0716778794"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">M-Pesa Paybill Business Number</label>
            <input
              type="text"
              value={settingsData.paybillNumber || ''}
              onChange={(e) => setSettingsData({ ...settingsData, paybillNumber: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition-all font-mono"
              placeholder="247247"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">M-Pesa Account Number</label>
            <input
              type="text"
              value={settingsData.paybillAccount || ''}
              onChange={(e) => setSettingsData({ ...settingsData, paybillAccount: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition-all font-mono"
              placeholder="0728490713"
            />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-800">
          <label className="block text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Tags className="w-4 h-4 text-accentOrange" />
            Product Categories
          </label>

          <div className="flex flex-wrap gap-2 mb-6 min-h-12 bg-black/20 p-4 rounded-2xl border border-white/5">
            {categories.map((cat, i) => (
              <div key={i} className="group flex items-center gap-2 bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs font-bold border border-gray-700 hover:border-accentOrange/50 transition-colors">
                {cat}
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {categories.length === 0 && <span className="text-gray-600 text-xs italic">No custom categories yet. Add some below!</span>}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-accentOrange/50 text-sm"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-6 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 border border-gray-700 transition"
            >
              Add
            </button>
          </div>
        </div>

        <MigrationPanel orders={orders} />

        <div className="pt-6 mt-6 border-t border-gray-800">
          <button
            type="submit"
            className="bg-accentOrange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-accentOrange/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5 animate-[spin_3s_linear_infinite]" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsTab;
