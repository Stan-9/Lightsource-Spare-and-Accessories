import { useState, useEffect, useMemo } from 'react';
import { 
  subscribeProducts, 
  deleteProduct, 
  updateProductStock, 
  getSettings, 
  updateSettings 
} from '../firebase/products';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Package, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  LayoutDashboard 
} from 'lucide-react';
import ProductModal from '../components/admin/ProductModal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, settings
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsData, setSettingsData] = useState({ shopName: '', whatsappNumber: '' });
  
  // Products Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubProducts = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });

    const loadSettings = async () => {
      const data = await getSettings();
      setSettingsData(data);
    };
    loadSettings();

    return () => unsubProducts();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id, name, imageUrl) => {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      try {
        await deleteProduct(id, imageUrl);
        toast.success(`${name} deleted successfully`);
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleStockUpdate = async (id, currentStock, change) => {
    const newStock = Math.max(0, currentStock + change);
    try {
      await updateProductStock(id, newStock);
      toast.success(`Stock updated`);
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(settingsData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  // Derived state
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock <= 0).length;
    const uniqueCats = new Set(products.map(p => p.category)).size;

    return { total, inStock, outOfStock, categories: uniqueCats };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);


  const NavButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === id 
          ? 'bg-accentOrange/10 text-accentOrange shadow-[inset_2px_0_0_0_#FF6B00]' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-accentOrange' : ''}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col md:flex-row font-poppins selection:bg-accentOrange/30">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20 sticky top-0 md:h-screen">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-accentOrange flex items-center justify-center font-bold text-white shadow-lg shadow-accentOrange/30">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">Admin</h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton id="overview" icon={LayoutDashboard} label="Overview" />
          <NavButton id="products" icon={Package} label="Products" />
          <NavButton id="settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 hover:text-red-300 transition font-medium border border-red-400/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-x-hidden min-h-screen">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Store Overview</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Total Products', value: stats.total, icon: Package, color: 'text-blue-500' },
                { label: 'In Stock', value: stats.inStock, icon: TrendingUp, color: 'text-green-500' },
                { label: 'Out of Stock', value: stats.outOfStock, icon: TrendingDown, color: 'text-red-500' },
                { label: 'Categories', value: stats.categories, icon: LayoutDashboard, color: 'text-purple-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-accentOrange/30 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rotate-12 -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
                  <div className={`w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-1 tracking-tight">{stat.value}</h3>
                  <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent Additions</h3>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-4">
                   {products.slice(0, 5).map(p => (
                     <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                       <div className="w-12 h-12 rounded-lg bg-gray-900 overflow-hidden shrink-0">
                         {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                         <p className="text-xs text-accentOrange mt-1">KES {p.price.toLocaleString()}</p>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${p.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                         {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-80px)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-white">Inventory Management</h2>
              
              <button
                onClick={handleAddProduct}
                className="bg-accentOrange hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-accentOrange/20 transition flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
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
              <div className="overflow-x-auto flex-1 h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4 w-16">Image</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 w-40">Stock Check</th>
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
                          <td className="p-4"><div className="h-8 bg-gray-800 rounded w-full"></div></td>
                          <td className="p-4"><div className="h-8 bg-gray-800 rounded w-full"></div></td>
                        </tr>
                      ))
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">
                          No products found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-800/30 transition group">
                          <td className="p-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                              ) : (
                                <span className="text-[10px] text-gray-500">No img</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-white">
                            <div className="line-clamp-2">{p.name}</div>
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-sm border border-gray-700">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-accentOrange whitespace-nowrap">
                            KES {p.price.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg p-1 w-max">
                              <button 
                                onClick={() => handleStockUpdate(p.id, p.stock, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                              >
                                -
                              </button>
                              <span className={`w-8 text-center font-bold text-sm ${p.stock <= 0 ? 'text-red-500' : 'text-white'}`}>
                                {p.stock}
                              </span>
                              <button 
                                onClick={() => handleStockUpdate(p.id, p.stock, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                              >
                                +
                              </button>
                            </div>
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
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Store Settings</h2>

            <form onSubmit={handleSaveSettings} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Shop Name</label>
                <input
                  type="text"
                  value={settingsData.shopName}
                  onChange={(e) => setSettingsData({...settingsData, shopName: e.target.value})}
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
                  value={settingsData.whatsappNumber}
                  onChange={(e) => setSettingsData({...settingsData, whatsappNumber: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentOrange focus:ring-1 focus:ring-accentOrange/50 transition-all font-mono"
                  placeholder="254700000000"
                  required
                />
              </div>

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
        )}

      </main>

      {/* Modals */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct}
      />
    </div>
  );
};

export default AdminDashboard;
