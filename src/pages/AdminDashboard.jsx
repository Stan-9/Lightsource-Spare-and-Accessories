import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import {
  Package,
  Settings as SettingsIcon,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
} from 'lucide-react';

import { auth } from '../firebase/config';
import {
  deleteProduct,
  updateProductStock,
  updateProduct,
  subscribeCategories,
  updateCategoriesList,
} from '../services/inventory';
import { updateSettings } from '../services/config';
import {
  updateOrderFulfillmentStatus,
  updateOrderPayment,
  recordCreditorPayment,
  normalizeOrder,
} from '../services/sales';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import { useSettings } from '../context/SettingsContext';

import ConfirmModal from '../components/shared/ConfirmModal';
import ProductModal from '../components/admin/ProductModal';
import ManualSaleModal from '../components/admin/ManualSaleModal';
import ReceiptModal from '../components/admin/ReceiptModal';

import OverviewTab from './admin-tabs/OverviewTab';
import InventoryTab from './admin-tabs/InventoryTab';
import OrdersTab from './admin-tabs/OrdersTab';
import AnalysisTab from './admin-tabs/AnalysisTab';
import CreditorsTab from './admin-tabs/CreditorsTab';
import SettingsTab from './admin-tabs/SettingsTab';
import ProcurementTab from './admin-tabs/ProcurementTab';

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
  const [activeTab, setActiveTab] = useState('overview');
  const { products, loading } = useProducts();
  const { orders } = useOrders();
  const { settings, updateSettingsState } = useSettings();

  const [categories, setCategories] = useState([]);
  const [settingsData, setSettingsData] = useState({
    shopName: '',
    whatsappNumber: '',
    contactNumber: '',
    paybillNumber: '',
    paybillAccount: '',
  });

  // Sync settingsData when global settings load
  useEffect(() => {
    if (settings) {
      setSettingsData(settings);
    }
  }, [settings]);

  // Inventory Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [restockInputs, setRestockInputs] = useState({});

  // Categories State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) =>
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  const closeConfirm = () =>
    setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));

  // Date range & analysis filters
  const [dateRange, setDateRange] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [analysisRange, setAnalysisRange] = useState('all');
  const [partialPaymentInputs, setPartialPaymentInputs] = useState({});

  // Receipt Modal State
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const navigate = useNavigate();

  // Categories subscription
  useEffect(() => {
    const unsubCategories = subscribeCategories((data) => {
      setCategories(data);
    });
    return () => unsubCategories();
  }, []);

  const activeCreditorOrders = useMemo(() => {
    return orders.filter(rawOrder => {
      const o = normalizeOrder(rawOrder);
      if (!o.isCredit) return false;
      if (o.fulfillmentStatus !== 'fulfilled') return false;
      if (o.balanceRemaining !== undefined) return o.balanceRemaining > 0;
      return o.paymentStatus === 'unpaid';
    });
  }, [orders]);

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
          const res = await deleteProduct(id, imageUrl);
          if (res && res.success === false) {
            toast.error(res.error || 'Failed to delete product');
          } else {
            toast.success(`${name} deleted`);
          }
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
      toast.success('Stock updated');
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
      const res = await updateSettings(settingsData);
      if (res && res.success) {
        updateSettingsState(settingsData);
        toast.success('Settings saved successfully');
      } else {
        toast.error(res?.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleUpdateOrderFulfillmentStatus = async (orderId, fulfillmentStatus) => {
    try {
      const res = await updateOrderFulfillmentStatus(orderId, fulfillmentStatus);
      if (res && res.success) {
        toast.success(`Fulfillment updated to ${fulfillmentStatus}`);
      } else {
        toast.error(`Failed to update fulfillment status: ${res?.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('Failed to update fulfillment status');
    }
  };

  const handleUpdateOrderPayment = async (orderId, paymentStatus, paymentType) => {
    try {
      const res = await updateOrderPayment(orderId, paymentStatus, paymentType);
      if (res && res.success) {
        toast.success('Payment status updated');
      } else {
        toast.error(`Failed to update payment: ${res?.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const handleRecordPartialPayment = async (orderId) => {
    const inputVal = Number(partialPaymentInputs[orderId] || 0);
    if (isNaN(inputVal) || inputVal <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    try {
      await recordCreditorPayment(orderId, inputVal);
      setPartialPaymentInputs(prev => ({ ...prev, [orderId]: '' }));
      toast.success('Payment recorded successfully');
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      toast.error('Category already exists');
      return;
    }
    const newList = [...categories, newCategoryName.trim()];
    try {
      await updateCategoriesList(newList);
      setNewCategoryName('');
      toast.success('Category added');
    } catch {
      toast.error('Failed to add category');
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
    const headers = ['Name', 'Category', 'Buying Price', 'Selling Price', 'Stock', 'Total Value (Retail)'];
    const rows = products.map(p => [
      p.name,
      p.category,
      p.buyingPrice || 0,
      p.price,
      p.stock,
      p.price * p.stock,
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `LightSource_Inventory_${new Date().toLocaleDateString()}.csv`);
    a.click();
    toast.success('Inventory exported!');
  };

  const handlePrintReceipt = (order) => {
    setSelectedOrderForReceipt(order);
    setIsReceiptModalOpen(true);
  };

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock <= 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 5).length;

    const inventoryValueRetail = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const inventoryValueCost = products.reduce((acc, p) => acc + ((p.buyingPrice || 0) * p.stock), 0);
    const potentialProfit = inventoryValueRetail - inventoryValueCost;
    const rangedOrders = orders.map(normalizeOrder);
    const completedOrders = rangedOrders.filter(o => o.fulfillmentStatus === 'fulfilled' && o.paymentStatus === 'paid');
    const actualSales = completedOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const actualProfit = completedOrders.reduce((acc, o) => {
      const orderProfit = (o.items || []).reduce((iAcc, item) => {
        return iAcc + ((item.price - (item.buyingPrice || 0)) * item.quantity);
      }, 0);
      return acc + orderProfit;
    }, 0);

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
      leastPerformer,
    };
  }, [products, orders]);

  const analysisStats = useMemo(() => {
    const now = new Date();
    const rangeDays = analysisRange === 'weekly' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - (rangeDays * 24 * 60 * 60 * 1000));

    const normalizedOrders = orders.map(normalizeOrder);
    const rangedOrders = normalizedOrders.filter(o => {
      if (analysisRange === 'all') return true;
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return date >= cutoffDate;
    });

    const completed = rangedOrders.filter(o => o.fulfillmentStatus === 'fulfilled' && o.paymentStatus === 'paid');

    let totalGrossRevenue = 0;
    let totalDiscountsGiven = 0;
    let netRevenueCollected = 0;
    let actualNetProfit = 0;
    let discountedSalesCount = 0;
    let fullPriceSalesCount = 0;

    const productDiscounts = {};
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
        const itemNet = final * qty;
        const itemDiscount = Math.max(0, itemGross - itemNet);

        totalGrossRevenue += itemGross;
        netRevenueCollected += itemNet;
        totalDiscountsGiven += itemDiscount;
        orderProfit += (final - buying) * qty;

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

    const topDiscountedProducts = Object.values(productDiscounts).sort((a, b) => b.amount - a.amount);

    return {
      totalGrossRevenue,
      totalDiscountsGiven,
      netRevenueCollected,
      actualNetProfit,
      marginErosion: totalDiscountsGiven,
      discountedSalesCount,
      fullPriceSalesCount,
      topDiscountedProducts,
      discountedSalesList,
    };
  }, [orders, analysisRange]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col md:flex-row">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirm}
      />

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900/50 border-b md:border-b-0 md:border-r border-gray-800 p-4 md:p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accentOrange flex items-center justify-center font-black text-white text-xl shadow-lg shadow-accentOrange/20">
              LS
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight">LightSource</h1>
              <p className="text-[10px] text-accentOrange font-black tracking-widest uppercase">Admin Portal</p>
            </div>
          </div>

          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            <NavButton id="overview" icon={LayoutDashboard} label="Overview" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton id="products" icon={Package} label="Inventory" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton id="orders" icon={ShoppingCart} label="Orders" badge={orders.length} activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton id="procurement" icon={Truck} label="Procurement" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton id="analysis" icon={TrendingUp} label="Analysis" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton id="creditors" icon={TrendingDown} label="Creditors" badge={activeCreditorOrders.length > 0 ? activeCreditorOrders.length : null} activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton id="settings" icon={SettingsIcon} label="Settings" activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>
        </div>

        <div className="pt-4 md:pt-6 border-t border-gray-800/50 mt-4 md:mt-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            loading={loading}
            orders={orders}
            products={products}
            setActiveTab={setActiveTab}
            setOrderPaymentFilter={setOrderPaymentFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            handleEditProduct={handleEditProduct}
          />
        )}

        {activeTab === 'products' && (
          <InventoryTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loading}
            filteredProducts={filteredProducts}
            restockInputs={restockInputs}
            setRestockInputs={setRestockInputs}
            handleExportCSV={handleExportCSV}
            handleAddProduct={handleAddProduct}
            handleStockUpdate={handleStockUpdate}
            handleBulkRestock={handleBulkRestock}
            handleToggleVisibility={handleToggleVisibility}
            handleEditProduct={handleEditProduct}
            handleDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            orderStatusFilter={orderStatusFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            orderPaymentFilter={orderPaymentFilter}
            setOrderPaymentFilter={setOrderPaymentFilter}
            setIsSaleModalOpen={setIsSaleModalOpen}
            handleUpdateOrderFulfillmentStatus={handleUpdateOrderFulfillmentStatus}
            handleUpdateOrderPayment={handleUpdateOrderPayment}
            handlePrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab
            analysisRange={analysisRange}
            setAnalysisRange={setAnalysisRange}
            analysisStats={analysisStats}
          />
        )}

        {activeTab === 'creditors' && (
          <CreditorsTab
            activeCreditorOrders={activeCreditorOrders}
            partialPaymentInputs={partialPaymentInputs}
            setPartialPaymentInputs={setPartialPaymentInputs}
            handleRecordPartialPayment={handleRecordPartialPayment}
            handleUpdateOrderPayment={handleUpdateOrderPayment}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementTab products={products} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settingsData={settingsData}
            setSettingsData={setSettingsData}
            categories={categories}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            handleSaveSettings={handleSaveSettings}
            handleAddCategory={handleAddCategory}
            handleDeleteCategory={handleDeleteCategory}
            orders={orders}
          />
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
