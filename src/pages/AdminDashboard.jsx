import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeProducts,
  deleteProduct,
  updateProductStock,
  updateProduct,
  getSettings,
  updateSettings,
  subscribeOrders,
  subscribeCategories,
  updateCategoriesList,
  updateOrderStatus,
  updateOrderPayment,
} from '../firebase/products';
import ConfirmModal from '../components/shared/ConfirmModal';
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
  Tag,
  AlertCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Printer
} from 'lucide-react';
import ProductModal from '../components/admin/ProductModal';
import ManualSaleModal from '../components/admin/ManualSaleModal';
import ReceiptModal from '../components/admin/ReceiptModal';

const NavButton = ({ id, icon: Icon, label, badge = null, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`shrink-0 md:w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium group ${
      activeTab === id 
        ? 'bg-accentOrange/10 text-accentOrange md:shadow-[inset_2px_0_0_0_#FF6B00]' 
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-2 md:gap-3">
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-accentOrange' : 'group-hover:text-gray-200'}`} />
      <span className="whitespace-nowrap truncate">{label}</span>
    </div>
    {badge !== null && (
      <span className={`ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${activeTab === id ? 'bg-accentOrange text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}>
        {badge}
      </span>
    )}
  </button>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, analysis, creditors, settings
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsData, setSettingsData] = useState({ shopName: '', whatsappNumber: '' });
  
  // Products Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  // Bulk restock state: { [productId]: inputValue }
  const [restockInputs, setRestockInputs] = useState({});

  // Categories State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) =>
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  const closeConfirm = () =>
    setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));

  // Overview date range filter
  const [dateRange, setDateRange] = useState('all'); // all | today | week | month

  // Orders tab filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');

  // Analysis range selection
  const [analysisRange, setAnalysisRange] = useState('weekly'); // weekly | monthly

  // Print receipt state
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

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
    } catch {
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

  const handleDeleteProduct = (id, name, imageUrl) => {
    openConfirm(
      `Delete "${name}"?`,
      'This action cannot be undone. The product will be permanently removed from your inventory.',
      async () => {
        closeConfirm();
        try {
          await deleteProduct(id, imageUrl);
          toast.success(`${name} deleted`);
        } catch {
          toast.error('Failed to delete product');
        }
      }
    );
  };

  const handleStockUpdate = async (id, currentStock, change) => {
    const newStock = Math.max(0, currentStock + change);
    try {
      await updateProductStock(id, newStock);
      toast.success(`Stock updated`);
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const newVisibility = !(product.isVisible ?? true);
      await updateProduct(product.id, product, { ...product, isVisible: newVisibility });
      toast.success(newVisibility ? 'Product visible on storefront' : 'Product hidden from storefront');
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(settingsData);
      toast.success('Settings saved successfully');
    } catch {
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
    } catch {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = (name) => {
    openConfirm(
      `Remove "${name}"?`,
      'Existing products will keep this category tag until you manually update them.',
      async () => {
        closeConfirm();
        const newList = categories.filter(c => c !== name);
        try {
          await updateCategoriesList(newList);
          toast.success('Category removed');
        } catch {
          toast.error('Failed to remove category');
        }
      }
    );
  };

  // Bulk restock: set exact stock from the restock input
  const handleBulkRestock = async (product) => {
    const inputVal = parseInt(restockInputs[product.id] || '0', 10);
    if (isNaN(inputVal) || inputVal < 1) {
      toast.error('Enter a valid quantity to add');
      return;
    }
    const newStock = product.stock + inputVal;
    try {
      await updateProductStock(product.id, newStock);
      setRestockInputs(prev => ({ ...prev, [product.id]: '' }));
      toast.success(`Restocked +${inputVal} units (now ${newStock})`);
    } catch {
      toast.error('Failed to update stock');
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

  const handlePrintReceipt = (order) => {
    setSelectedOrderForReceipt(order);
    setIsReceiptModalOpen(true);
  };

  // Date-range helper
  const filterByDateRange = useCallback((ordersList) => {
    if (dateRange === 'all') return ordersList;
    const now = new Date();
    return ordersList.filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      if (dateRange === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (dateRange === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateRange === 'month') {
        const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
        return d >= monthAgo;
      }
      return true;
    });
  }, [dateRange]);

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
    const rangedOrders = orders;
    const completedOrders = rangedOrders.filter(o => o.status === 'completed');
    const actualSales = completedOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const actualProfit = completedOrders.reduce((acc, o) => {
      const orderProfit = (o.items || []).reduce((iAcc, item) => {
        return iAcc + ((item.price - (item.buyingPrice || 0)) * item.quantity);
      }, 0);
      return acc + orderProfit;
    }, 0);

    // Most/Least Sold
    const itemSales = {};
    completedOrders.forEach(o => {
      (o.items || []).forEach(item => {
        itemSales[item.name] = (itemSales[item.name] || 0) + (item.quantity || 1);
      });
    });
    const sortedSales = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
    const topPerformer = sortedSales[0] || ['None', 0];
    const leastPerformer = sortedSales.length > 0 ? sortedSales[sortedSales.length - 1] : ['None', 0];

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

  const analysisStats = useMemo(() => {
    const now = new Date();
    const rangeDays = analysisRange === 'weekly' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - (rangeDays * 24 * 60 * 60 * 1000));

    const rangedOrders = orders.filter(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return date >= cutoffDate;
    });

    const completed = rangedOrders.filter(o => o.status === 'completed');

    let totalGrossRevenue = 0;
    let totalDiscountsGiven = 0;
    let netRevenueCollected = 0;
    let actualNetProfit = 0;
    
    let discountedSalesCount = 0;
    let fullPriceSalesCount = 0;
    
    const productDiscounts = {}; // name -> { count, amount }
    const discountedSalesList = [];

    completed.forEach(o => {
      let orderHasDiscount = false;
      let orderProfit = 0;
      
      (o.items || []).forEach(item => {
        const orig = item.originalPrice !== undefined ? item.originalPrice 
                     : (item.original_price !== undefined ? item.original_price : item.price);
        const final = item.finalPrice !== undefined ? item.finalPrice 
                     : (item.final_price !== undefined ? item.final_price : item.price);
        const buying = item.buyingPrice !== undefined ? item.buyingPrice 
                      : (item.buying_price !== undefined ? item.buying_price : 0);
        const qty = item.quantity || 1;
        
        const itemGross = orig * qty;
        const itemDiscount = Math.max(0, orig - final) * qty;
        const itemNet = final * qty;
        
        orderProfit += (final - buying) * qty;
        
        totalGrossRevenue += itemGross;
        totalDiscountsGiven += itemDiscount;
        netRevenueCollected += itemNet;
        
        if (itemDiscount > 0) {
          orderHasDiscount = true;
          if (!productDiscounts[item.name]) {
            productDiscounts[item.name] = { name: item.name, count: 0, amount: 0 };
          }
          productDiscounts[item.name].count += qty;
          productDiscounts[item.name].amount += itemDiscount;
        }
      });
      
      actualNetProfit += orderProfit;
      
      if (orderHasDiscount) {
        discountedSalesCount++;
        discountedSalesList.push(o);
      } else {
        fullPriceSalesCount++;
      }
    });

    const topDiscountedProducts = Object.values(productDiscounts)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const marginErosion = totalDiscountsGiven;

    return {
      totalGrossRevenue,
      totalDiscountsGiven,
      netRevenueCollected,
      actualNetProfit,
      marginErosion,
      discountedSalesCount,
      fullPriceSalesCount,
      topDiscountedProducts,
      discountedSalesList,
      completedCount: completed.length
    };
  }, [orders, analysisRange]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col md:flex-row font-poppins selection:bg-accentOrange/30">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 md:border-r border-b border-gray-800 flex flex-col z-20 sticky top-0 md:h-screen shrink-0 shadow-2xl md:shadow-none">
        <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-accentOrange flex items-center justify-center font-bold text-white shadow-lg shadow-accentOrange/30">
              L
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">LightSource</h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide italic">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition border border-red-500/20"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex md:flex-col p-2 md:p-4 gap-2 md:gap-0 md:space-y-2 overflow-x-auto md:overflow-y-auto no-scrollbar md:flex-1">
          <NavButton id="overview" icon={LayoutDashboard} label="Overview" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavButton id="products" icon={Package} label="Inventory" badge={products.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavButton id="orders" icon={ShoppingCart} label="Orders Log" badge={orders.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavButton id="analysis" icon={TrendingUp} label="Business Analysis" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavButton 
            id="creditors" 
            icon={TrendingDown} 
            label="Creditors" 
            badge={orders.filter(o => o.paymentType === 'Credit' && o.paymentStatus === 'Unpaid').length} 
            activeTab={activeTab} setActiveTab={setActiveTab}
          />
          <NavButton id="settings" icon={Settings} label="Settings" activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>

        <div className="hidden md:block p-4 border-t border-gray-800 bg-gray-900/50">
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
            <h2 className="text-3xl font-bold text-white mb-4 border-b border-gray-800 pb-4 flex items-center gap-3">
              Store Statistics
              <LayoutDashboard className="w-6 h-6 text-accentOrange opacity-50" />
            </h2>


            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="col-span-1 lg:col-span-4 bg-gradient-to-r from-accentOrange/20 to-transparent border border-accentOrange/30 p-8 rounded-3xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
                    <span className="text-accentOrange font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Warehouse Value (Cost)</span>
                    <h3 className="text-3xl font-black text-white tracking-tighter">
                      <span className="text-accentOrange text-lg mr-2 font-medium italic">KES</span>
                      {stats.inventoryCost.toLocaleString()}
                    </h3>
                    <p className="text-gray-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Total money tied in stock</p>
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
                          <h4 className="text-sm font-bold text-white truncate">{order.customerName || `${order.items.length} items ordered`}</h4>
                          <p className="text-[10px] text-gray-500 truncate">{order.items.map(i => i.name).join(', ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white italic">KES {order.total?.toLocaleString() || '0'}</p>
                          <p className={`text-[10px] uppercase font-black ${order.status === 'completed' ? 'text-green-500' : order.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                            {order.status || 'pending'}
                          </p>
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
                        <td colSpan="7" className="p-8 text-center text-gray-500">
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
                              KES {p.price.toLocaleString()}
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
                              {/* Bulk restock input */}
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
        )}

        {/* ORDERS LOG TAB */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:h-[calc(100vh-80px)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-white border-b border-gray-800 pb-4">Customer Orders Log</h2>
              <button
                onClick={() => setIsSaleModalOpen(true)}
                className="bg-accentOrange hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-accentOrange/20 transition flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Record Physical Sale
              </button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer or item..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accentOrange transition"
                />
              </div>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accentOrange"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={orderPaymentFilter}
                onChange={e => setOrderPaymentFilter(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accentOrange"
              >
                <option value="all">All Payments</option>
                <option value="Cash">Cash / Mpesa</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
              <div className="overflow-x-auto flex-1 md:h-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900/90 backdrop-blur sticky top-0 z-10 font-bold border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Grand Total</th>
                      <th className="p-4">Action</th>
                      <th className="p-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {(() => {
                      const filtered = orders.filter(o => {
                        const matchSearch = !orderSearch ||
                          (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (o.items || []).some(i => i.name?.toLowerCase().includes(orderSearch.toLowerCase()));
                        const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                        const matchPayment = orderPaymentFilter === 'all' || o.paymentType === orderPaymentFilter;
                        return matchSearch && matchStatus && matchPayment;
                      });
                      if (filtered.length === 0) return (
                        <tr><td colSpan="6" className="p-12 text-center text-gray-500 italic">No orders match your filters.</td></tr>
                      );
                      return filtered.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-800/30 transition group">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-white font-bold">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Processing...'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : ''}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{order.customerName || '—'}</span>
                                {order.flaggedForReview && (
                                  <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0">
                                    Discounted
                                  </span>
                                )}
                              </div>
                              {order.phone && <span className="text-[10px] text-gray-500">{order.phone}</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  <span className="text-accentOrange font-bold">{(item.quantity || 1)}x</span> {item.name || 'Unknown Item'}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-black text-white italic">KES {(order.total || 0).toLocaleString()}</span>
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
                                  handleUpdateOrderPayment(order.id, newType === 'Credit' ? 'Unpaid' : 'Paid', newType);
                                }}
                                className="text-[10px] font-black uppercase px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-400"
                              >
                                <option value="Cash">Cash/Mpesa</option>
                                <option value="Credit">Credit</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handlePrintReceipt(order)}
                              className="p-2 bg-gray-800 text-gray-400 hover:text-white hover:bg-accentOrange/20 border border-transparent hover:border-accentOrange/30 rounded-lg transition"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 text-gray-800 p-6 md:p-10 rounded-[2rem] shadow-inner border border-gray-200">
            
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                  Business Performance Analysis
                  <TrendingUp className="w-6 h-6 text-gray-900" />
                </h2>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  Detailed financial audits and cashier discount tracking for Riders Gear Nairobi.
                </p>
              </div>
              
              {/* Toggle Summary Pills */}
              <div className="flex bg-gray-200/80 p-1 rounded-xl shadow-inner border border-gray-300/30 shrink-0">
                <button
                  onClick={() => setAnalysisRange('weekly')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                    analysisRange === 'weekly'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Weekly Summary
                </button>
                <button
                  onClick={() => setAnalysisRange('monthly')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                    analysisRange === 'monthly'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Monthly Summary
                </button>
              </div>
            </div>

            {/* Metrics Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              
              {/* Gross Revenue */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-28">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2 leading-none">
                  Gross Revenue
                </span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight tabular-nums flex items-baseline mt-auto">
                  <span className="text-gray-400 text-xs font-bold mr-1 leading-none uppercase">KES</span>
                  {analysisStats.totalGrossRevenue.toLocaleString()}
                </h3>
              </div>

              {/* Total Discounts */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-28">
                <span className="text-[9px] font-black uppercase tracking-widest text-green-600 block mb-2 leading-none">
                  Total Discounts
                </span>
                <h3 className="text-2xl font-black text-green-600 tracking-tight tabular-nums flex items-baseline mt-auto">
                  <span className="text-green-500 text-xs font-bold mr-1 leading-none uppercase">KES</span>
                  {analysisStats.totalDiscountsGiven.toLocaleString()}
                </h3>
              </div>

              {/* Net Revenue */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-28">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2 leading-none">
                  Net Revenue
                </span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight tabular-nums flex items-baseline mt-auto">
                  <span className="text-gray-400 text-xs font-bold mr-1 leading-none uppercase">KES</span>
                  {analysisStats.netRevenueCollected.toLocaleString()}
                </h3>
              </div>

              {/* Actual Net Profit */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-28">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2 leading-none">
                  Actual Net Profit
                </span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight tabular-nums flex items-baseline mt-auto">
                  <span className="text-gray-400 text-xs font-bold mr-1 leading-none uppercase">KES</span>
                  {analysisStats.actualNetProfit.toLocaleString()}
                </h3>
              </div>

              {/* Margin Erosion */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-28">
                <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block mb-2 leading-none">
                  Margin Erosion
                </span>
                <h3 className="text-2xl font-black text-red-500 tracking-tight tabular-nums flex items-baseline mt-auto">
                  <span className="text-red-500 text-xs font-bold mr-1 leading-none uppercase">KES</span>
                  {analysisStats.marginErosion.toLocaleString()}
                </h3>
              </div>

            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left 2/3 Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Discount Frequency Card */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 pb-3 border-b border-gray-100">
                    Discount Frequency & Activity
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Rate */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Discount Rate</span>
                      <p className="text-3xl font-extrabold text-gray-900">
                        {(() => {
                          const total = analysisStats.discountedSalesCount + analysisStats.fullPriceSalesCount;
                          return total > 0 ? ((analysisStats.discountedSalesCount / total) * 100).toFixed(1) : '0.0';
                        })()}%
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">of transactions were discounted.</p>
                    </div>

                    {/* Discounted Orders */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Discounted Orders</span>
                      <p className="text-3xl font-extrabold text-gray-400">
                        <span className="text-green-600">{analysisStats.discountedSalesCount}</span>
                        <span className="mx-1 text-gray-300">/</span>
                        <span>{analysisStats.discountedSalesCount + analysisStats.fullPriceSalesCount}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">completed sales with manual pricing overrides.</p>
                    </div>

                    {/* Full Price Orders */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full-Price Orders</span>
                      <p className="text-3xl font-extrabold text-gray-400">
                        <span className="text-gray-900">{analysisStats.fullPriceSalesCount}</span>
                        <span className="mx-1 text-gray-300">/</span>
                        <span>{analysisStats.discountedSalesCount + analysisStats.fullPriceSalesCount}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">completed sales sold at standard catalog pricing.</p>
                    </div>

                  </div>
                </div>

                {/* Top Discounted Products Card */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 pb-3 border-b border-gray-100">
                    Top Discounted Products
                  </h4>
                  
                  {analysisStats.topDiscountedProducts.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs font-medium italic">
                      No discounted product listings in this period.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {analysisStats.topDiscountedProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                          <div>
                            <p className="text-sm font-bold text-gray-900 uppercase leading-none">{p.name}</p>
                            <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                              {p.count} units sold with manual pricing adjustments
                            </span>
                          </div>
                          <span className="text-sm font-extrabold text-red-500 shrink-0">
                            - KES {p.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Audit Log Column */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] lg:col-span-1 min-h-[350px] flex flex-col">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 shrink-0">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Audit Log
                  </h4>
                  <span className="bg-green-50 text-green-600 border border-green-200/50 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                    {analysisStats.discountedSalesCount} DISCOUNTED SALES
                  </span>
                </div>

                {analysisStats.discountedSalesList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Tag className="w-6 h-6 text-gray-400/80" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium italic">
                      No manual overrides recorded in this time range.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-gray-100 pr-1">
                    {analysisStats.discountedSalesList.map((order, idx) => {
                      const orderDiscount = (order.items || []).reduce((acc, item) => {
                        const orig = item.originalPrice !== undefined ? item.originalPrice : (item.original_price !== undefined ? item.original_price : item.price);
                        const final = item.finalPrice !== undefined ? item.finalPrice : (item.final_price !== undefined ? item.final_price : item.price);
                        return acc + (Math.max(0, orig - final) * (item.quantity || 1));
                      }, 0);

                      return (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-none">
                                {order.customerName || 'Cashier Sale'}
                              </p>
                              <span className="text-[9px] text-gray-400 font-medium mt-1 block">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <span className="text-xs font-black text-red-500">
                              - KES {orderDiscount.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-1">
                            {(order.items || []).map((item, itemIdx) => {
                              const orig = item.originalPrice !== undefined ? item.originalPrice : (item.original_price !== undefined ? item.original_price : item.price);
                              const final = item.finalPrice !== undefined ? item.finalPrice : (item.final_price !== undefined ? item.final_price : item.price);
                              const discount = Math.max(0, orig - final) * (item.quantity || 1);
                              if (discount <= 0) return null;
                              return (
                                <div key={itemIdx} className="flex justify-between text-[9px] text-gray-500 font-medium">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span className="text-red-400 font-bold">- KES {discount.toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Note */}
            <p className="text-[11px] text-gray-500 italic mt-8 bg-transparent border-t border-gray-200/60 pt-6 leading-relaxed">
              Note: Profit is calculated based on the final sold prices recorded at checkout and their corresponding buying prices. Margin Erosion measures the potential gross revenue forfeited to customer discounts. Only completed sales transactions are compiled here.
            </p>
          </div>
        )}

        {/* CREDITORS TAB */}
        {activeTab === 'creditors' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:h-[calc(100vh-80px)]">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
              Creditors Tracker
              <TrendingDown className="w-6 h-6 text-red-500 opacity-50" />
            </h2>
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
              <div className="overflow-x-auto flex-1 md:h-0">
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

      <ManualSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        products={products}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={selectedOrderForReceipt}
        settings={settingsData}
      />
    </div>
  );
};

export default AdminDashboard;
