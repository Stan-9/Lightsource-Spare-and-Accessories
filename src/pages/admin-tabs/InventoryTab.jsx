import { Search, Plus, AlertCircle, Edit, Trash2 } from 'lucide-react';

/**
 * InventoryTab Component
 * Displays product table, search filtering, restock inputs, storefront visibility toggles, and edit/delete actions.
 */
const InventoryTab = ({
  searchQuery,
  setSearchQuery,
  loading,
  filteredProducts,
  restockInputs,
  setRestockInputs,
  handleExportCSV,
  handleAddProduct,
  handleStockUpdate,
  handleBulkRestock,
  handleToggleVisibility,
  handleEditProduct,
  handleDeleteProduct,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:h-[calc(100vh-80px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-white">Inventory Management</h2>

        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-5 rounded-xl border border-gray-700 transition flex items-center gap-2"
          >
            Export CSV
          </button>
          <button
            onClick={handleAddProduct}
            className="bg-accentOrange hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-accentOrange/20 transition flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="mb-6 relative max-w-md shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accentOrange transition focus:ring-1 focus:ring-accentOrange/50 shadow-inner"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="overflow-x-auto flex-1 md:h-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
              <tr>
                <th className="p-4 w-16 text-center">Image</th>
                <th className="p-4">Name/Category</th>
                <th className="p-4">Cost (Buying)</th>
                <th className="p-4">Retail (Selling)</th>
                <th className="p-4">Total Profit (Est)</th>
                <th className="p-4 w-40">Stock Check</th>
                <th className="p-4 w-36">Restock</th>
                <th className="p-4 text-center">Storefront</th>
                <th className="p-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="w-12 h-12 bg-gray-800 rounded-lg"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-800 rounded w-3/4"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-800 rounded w-1/2"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-800 rounded w-1/3"></div></td>
                    <td className="p-4"><div className="h-4 bg-gray-800 rounded w-1/2"></div></td>
                    <td className="p-4"><div className="h-8 bg-gray-800 rounded w-full"></div></td>
                    <td className="p-4"><div className="h-8 bg-gray-800 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className={`transition group border-b border-gray-800/40 hover:bg-gray-800/30 ${p.stock > 0 && p.stock < 5 ? 'bg-red-500/5' : ''}`}>
                    <td className="p-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden flex items-center justify-center relative">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        ) : (
                          <span className="text-[10px] text-gray-500">No img</span>
                        )}
                        {p.stock > 0 && p.stock < 5 && (
                          <div className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-bl-lg animate-pulse">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold truncate max-w-[180px]">{p.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category}</span>
                      </div>
                    </td>
                    <td className="p-4 tabular-nums text-gray-500 font-medium">
                      KES {(p.buyingPrice || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="tabular-nums text-accentOrange font-black italic whitespace-nowrap">
                        KES {p.price?.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        {p.price > 0 && (p.buyingPrice || 0) > 0 ? (
                          <>
                            <span className={`tabular-nums font-black whitespace-nowrap ${p.price > (p.buyingPrice || 0) ? 'text-green-500' : 'text-red-500'}`}>
                              KES {((p.price - (p.buyingPrice || 0)) * p.stock).toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${p.price > (p.buyingPrice || 0) ? 'text-green-500/70' : 'text-red-500/70'}`}>
                              {(((p.price - (p.buyingPrice || 0)) / p.price) * 100).toFixed(1)}% Margin
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm italic">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 border rounded-lg p-1 w-max transition-colors ${p.stock > 0 && p.stock < 5 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-900 border-gray-700'}`}>
                        <button
                          onClick={() => handleStockUpdate(p.id, p.stock, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => handleStockUpdate(p.id, 0, parseInt(e.target.value) || 0)}
                          className={`w-12 text-center font-bold text-sm bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${p.stock <= 0 ? 'text-red-500' : p.stock < 5 ? 'text-red-400' : 'text-white'}`}
                        />
                        <button
                          onClick={() => handleStockUpdate(p.id, p.stock, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="+qty"
                          value={restockInputs[p.id] || ''}
                          onChange={e => setRestockInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="w-16 text-center text-sm bg-gray-900 border border-gray-700 rounded-lg py-1 focus:outline-none focus:border-accentOrange text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => handleBulkRestock(p)}
                          className="px-2 py-1 bg-accentOrange/10 text-accentOrange border border-accentOrange/30 rounded-lg text-[10px] font-black uppercase hover:bg-accentOrange hover:text-white transition"
                        >
                          Add
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleVisibility(p)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          p.isVisible !== false
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                        }`}
                      >
                        {p.isVisible !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="p-2 bg-gray-800 text-gray-300 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/50 border border-transparent rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name, p.imageUrl)}
                          className="p-2 bg-gray-800 text-gray-300 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;
