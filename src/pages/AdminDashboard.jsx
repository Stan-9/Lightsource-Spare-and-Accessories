import { useState, useEffect, useMemo } from 'react';
import { 
  subscribeProducts, 
  deleteProduct, 
  updateProductStock, 
  getSettings, 
  updateSettings,
  subscribeOrders,
  subscribeCategories,
  updateCategoriesList,
  updateOrderStatus,
  updateOrderPayment
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
  LayoutDashboard,
  ShoppingCart,
  Tags,
  AlertCircle,
  Clock,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import ProductModal from '../components/admin/ProductModal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, creditors, settings
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsData, setSettingsData] = useState({ shopName: '', whatsappNumber: '' });
  
  // Products Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Categories State
  const [newCategoryName, setNewCategoryName] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubProducts = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });

    const unsubOrders = subscribeOrders((data) => {
      setOrders(data);
    });

    const unsubCategories = subscribeCategories((data) => {
      setCategories(data);
    });

    const loadSettings = async () => {
      const data = await getSettings();
      setSettingsData(data);
    };
    loadSettings();

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCategories();
    };
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

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateOrderPayment = async (orderId, paymentStatus, paymentType) => {
    try {
      await updateOrderPayment(orderId, paymentStatus, paymentType);
      toast.success('Payment status updated');
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      toast.error("Category already exists");
      return;
    }
    const newList = [...categories, newCategoryName.trim()];
    try {
      await updateCategoriesList(newList);
      setNewCategoryName('');
      toast.success("Category added");
    } catch (e) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (name) => {
    if (window.confirm(`Remove category "${name}"? Existing products will still keep this category until updated.`)) {
      const newList = categories.filter(c => c !== name);
      try {
        await updateCategoriesList(newList);
        toast.success("Category removed");
      } catch (e) {
        toast.error("Failed to remove category");
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Category", "Buying Price", "Selling Price", "Stock", "Total Value (Retail)"];
    const rows = products.map(p => [
      p.name,
      p.category,
      p.buyingPrice || 0,
      p.price,
      p.stock,
      p.price * p.stock
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `LightSource_Inventory_${new Date().toLocaleDateString()}.csv`);
    a.click();
    toast.success("Inventory exported!");
  };

  // Derived state
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock <= 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 5).length;
    
    // Inventory Valuation
    const inventoryValueRetail = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const inventoryValueCost = products.reduce((acc, p) => acc + ((p.buyingPrice || 0) * p.stock), 0);
    const potentialProfit = inventoryValueRetail - inventoryValueCost;

    // Sales Performance (Only Completed Orders)
    const completedOrders = orders.filter(o => o.status === 'completed');
    const actualSales = completedOrders.reduce((acc, o) => acc + o.total, 0);
    
    // Profit Calculation (Needs items to have buyingPrice at time of order, for now using current)
    const actualProfit = completedOrders.reduce((acc, o) => {
      const orderProfit = o.items.reduce((itemAcc, item) => {
        const product = products.find(p => p.id === item.id);
        const cost = product?.buyingPrice || 0;
        return itemAcc + ((item.price - cost) * (item.quantity || 1));
      }, 0);
      return acc + orderProfit;
    }, 0);

    // Most/Least Sold
    const itemSales = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        itemSales[item.name] = (itemSales[item.name] || 0) + (item.quantity || 1);
      });
    });

    const sortedSales = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
    const topPerformer = sortedSales[0] || ["None", 0];
    const leastPerformer = sortedSales.length > 0 ? sortedSales[sortedSales.length - 1] : ["None", 0];

    return { 
      total, inStock, outOfStock, lowStock, 
      totalValue: inventoryValueRetail,
      inventoryCost: inventoryValueCost,
      potentialProfit,
      actualSales,
      actualProfit,
      topPerformer,
      leastPerformer
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);


  const NavButton = ({ id, icon: Icon, label, badge = null }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium group ${
        activeTab === id 
          ? 'bg-accentOrange/10 text-accentOrange shadow-[inset_2px_0_0_0_#FF6B00]' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${activeTab === id ? 'text-accentOrange' : 'group-hover:text-gray-200'}`} />
        {label}
      </div>
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === id ? 'bg-accentOrange text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col md:flex-row font-poppins selection:bg-accentOrange/30">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20 sticky top-0 md:h-screen">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-accentOrange flex items-center justify-center font-bold text-white shadow-lg shadow-accentOrange/30">
              L
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">LightSource</h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide italic">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton id="overview" icon={LayoutDashboard} label="Overview" />
          <NavButton id="products" icon={Package} label="Inventory" badge={products.length} />
          <NavButton id="orders" icon={ShoppingCart} label="Orders Log" badge={orders.length} />
          <NavButton 
            id="creditors" 
            icon={TrendingDown} 
            label="Creditors" 
            badge={orders.filter(o => o.paymentType === 'Credit' && o.paymentStatus === 'Unpaid').length} 
          />
          <NavButton id="settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition font-black uppercase text-[10px] tracking-widest border border-red-500/20"
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
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
              Store Statistics
              <LayoutDashboard className="w-6 h-6 text-accentOrange opacity-50" />
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="col-span-1 lg:col-span-4 bg-gradient-to-r from-accentOrange/20 to-transparent border border-accentOrange/30 p-8 rounded-3xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="md:border-r border-white/10 pr-8">
                    <span className="text-accentOrange font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Warehouse Value (Cost)</span>
                    <h3 className="text-3xl font-black text-white tracking-tighter">
                      <span className="text-accentOrange text-lg mr-2 font-medium italic">KES</span>
                      {stats.inventoryCost.toLocaleString()}
                    </h3>
                    <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Total money tied in stock</p>
                  </div>
                  
                  <div className="md:border-r border-white/10 pr-8">
                    <span className="text-green-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Projected Potential Profit</span>
                    <h3 className="text-3xl font-black text-white tracking-tighter">
                      <span className="text-green-500 text-lg mr-2 font-medium italic">KES</span>
                      {stats.potentialProfit.toLocaleString()}
                    </h3>
                    <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Estimated earnings if all sold</p>
                  </div>

                  <div>
                    <span className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Actual Store Profit</span>
                    <h3 className="text-3xl font-black text-white tracking-tighter">
                      <span className="text-blue-500 text-lg mr-2 font-medium italic">KES</span>
                      {stats.actualProfit.toLocaleString()}
                    </h3>
                    <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-wider">From {orders.filter(o => o.status === 'completed').length} completed sales</p>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-5">
                  <TrendingUp className="w-64 h-64 rotate-12" />
                </div>
              </div>

              {[
                { label: 'Total Revenue', value: stats.actualSales, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Most Sold Item', value: stats.topPerformer[0], sub: `${stats.topPerformer[1]} units`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
                { label: 'Least Sold Item', value: stats.leastPerformer[0], sub: `${stats.leastPerformer[1]} units`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
                { label: 'Low Stock Level', value: stats.lowStock, icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-gray-700 transition-all shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tabular-nums truncate max-w-[120px]">{stat.value.toLocaleString()}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                      {stat.sub && <p className="text-[9px] text-gray-600 font-medium italic mt-0.5">{stat.sub}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accentOrange" />
                    Latest Orders
                  </h3>
                  <button onClick={() => setActiveTab('orders')} className="text-accentOrange text-xs font-black uppercase tracking-widest hover:underline">View All</button>
                </div>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 opacity-30 italic text-sm">No orders logged yet</div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 4).map(order => (
                      <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/30 border border-white/5 hover:border-white/10 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-accentOrange group-hover:text-white transition-colors">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-bold">{new Date(order.createdAt?.toDate()).toLocaleDateString()}</p>
                          <h4 className="text-sm font-bold text-white truncate">{order.items.length} items ordered</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white italic">KES {order.total.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Low Stock Alert
                  </h3>
                </div>
                <div className="space-y-4">
                  {products.filter(p => p.stock > 0 && p.stock < 5).slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                      <div className="w-10 h-10 rounded-xl bg-gray-900 overflow-hidden shrink-0">
                        {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                        <div className={`text-[10px] font-black uppercase mt-1 text-yellow-500`}>
                           Only {p.stock} units left
                        </div>
                      </div>
                      <button onClick={() => handleEditProduct(p)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {products.filter(p => p.stock > 0 && p.stock < 5).length === 0 && (
                    <div className="text-center py-10 opacity-30 italic text-sm">Inventory levels are healthy</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-80px)]">
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
              <div className="overflow-x-auto flex-1 h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4 w-16 text-center">Image</th>
                      <th className="p-4">Name/Category</th>
                      <th className="p-4">Cost (Buying)</th>
                      <th className="p-4">Retail (Selling)</th>
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
                          <td className="p-4 tabular-nums text-accentOrange font-black italic whitespace-nowrap">
                            KES {p.price.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className={`flex items-center gap-2 border rounded-lg p-1 w-max transition-colors ${p.stock > 0 && p.stock < 5 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-900 border-gray-700'}`}>
                              <button 
                                onClick={() => handleStockUpdate(p.id, p.stock, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                              >
                                -
                              </button>
                              <span className={`w-8 text-center font-bold text-sm ${p.stock <= 0 ? 'text-red-500' : p.stock < 5 ? 'text-red-400' : 'text-white'}`}>
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

        {/* ORDERS LOG TAB */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-80px)]">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Customer Orders Log</h2>
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
              <div className="overflow-x-auto flex-1 h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Grand Total</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-500 italic">
                          No order attempts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-800/30 transition group">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-white font-bold">{new Date(order.createdAt?.toDate()).toLocaleDateString()}</span>
                              <span className="text-xs text-gray-500">{new Date(order.createdAt?.toDate()).toLocaleTimeString()}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  <span className="text-accentOrange font-bold">{item.quantity}x</span> {item.name}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-black text-white italic">KES {order.total.toLocaleString()}</span>
                          </td>
                          <td className="p-4">
                             <div className="flex flex-col gap-2">
                               <select 
                                 value={order.status} 
                                 onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                 className={`text-[10px] font-black uppercase px-2 py-1 rounded border transition ${
                                   order.status === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                   order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                   'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                 }`}
                               >
                                 <option value="pending">Pending</option>
                                 <option value="completed">Completed</option>
                                 <option value="cancelled">Cancelled</option>
                               </select>

                               <select 
                                 value={order.paymentType || 'Cash'} 
                                 onChange={(e) => {
                                   const newType = e.target.value;
                                   const newStatus = newType === 'Credit' ? 'Unpaid' : 'Paid';
                                   handleUpdateOrderPayment(order.id, newStatus, newType);
                                 }}
                                 className="text-[10px] font-black uppercase px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-400"
                               >
                                 <option value="Cash">Cash</option>
                                 <option value="Credit">Credit</option>
                               </select>
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

        {/* CREDITORS TAB */}
        {activeTab === 'creditors' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-80px)]">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
              Creditors Tracker
              <TrendingDown className="w-6 h-6 text-red-500 opacity-50" />
            </h2>
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
              <div className="overflow-x-auto flex-1 h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4">Customer/Time</th>
                      <th className="p-4">Amount Owed</th>
                      <th className="p-4">Credit Age</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {orders.filter(o => o.paymentType === 'Credit' && o.paymentStatus === 'Unpaid').length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-500 italic">
                          No outstanding debts found. Good job!
                        </td>
                      </tr>
                    ) : (
                      orders.filter(o => o.paymentType === 'Credit' && o.paymentStatus === 'Unpaid').map((order) => {
                        const ageInDays = Math.floor((new Date() - order.createdAt?.toDate()) / (1000 * 60 * 60 * 24));
                        const isOverdue = ageInDays >= 2;
                        
                        return (
                          <tr key={order.id} className={`transition group ${isOverdue ? 'bg-red-500/5' : 'hover:bg-gray-800/30'}`}>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{order.customerName || 'WhatsApp Customer'}</span>
                                <span className="text-[10px] text-gray-500">{new Date(order.createdAt?.toDate()).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`font-black italic ${isOverdue ? 'text-red-500' : 'text-white'}`}>KES {order.total.toLocaleString()}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isOverdue ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                                  {ageInDays} Days Old
                                </span>
                                {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" title="Overdue Alert!" />}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleUpdateOrderPayment(order.id, 'Paid', 'Credit')}
                                className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/30 rounded-lg text-xs font-black uppercase hover:bg-green-500 hover:text-white transition"
                              >
                                Mark as Paid
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
        categories={categories}
      />
    </div>
  );
};

export default AdminDashboard;
