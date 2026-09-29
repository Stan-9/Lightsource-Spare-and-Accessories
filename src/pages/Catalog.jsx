import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/shared/Header';
import SkeletonCard from '../components/shared/SkeletonCard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../hooks/useProducts';
import { useSettings } from '../context/SettingsContext';
import { Search, Plus, Settings, ChevronRight, Home } from 'lucide-react';
import { updateSEO } from '../services/seo';
import { isProductSellable } from '../services/procurement/procurementUtils';

const Catalog = () => {
  const { category: routeCategory } = useParams();
  const { products, loading } = useProducts();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addToCart, cartItems } = useCart();

  const categories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => p.category))];
    return ['All', ...uniqueCats.filter(Boolean).sort()];
  }, [products]);

  const activeCategory = useMemo(() => {
    if (!routeCategory) return 'All';
    const cleanRouteCat = routeCategory.replace(/-/g, ' ').toLowerCase();
    const found = categories.find(c => c.toLowerCase() === cleanRouteCat);
    return found || 'All';
  }, [routeCategory, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchSearch && matchCategory && isProductSellable(p);
    });
  }, [products, searchQuery, activeCategory]);

  useEffect(() => {
    const title = activeCategory === 'All' 
      ? 'Genuine Motorbike Parts Catalog' 
      : `${activeCategory} Parts Catalog`;
    const description = `Browse our selection of genuine motorbike ${activeCategory.toLowerCase()} parts. LightSource Motors offers top-grade components in Kenya.`;
    const canonical = `${window.location.origin}/catalog${activeCategory !== 'All' ? `/${activeCategory.toLowerCase().replace(/\s+/g, '-')}` : ''}`;
    
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Catalog",
          "item": `${window.location.origin}/catalog`
        }
      ]
    };

    if (activeCategory !== 'All') {
      breadcrumbSchema.itemListElement.push({
        "@type": "ListItem",
        "position": 3,
        "name": activeCategory,
        "item": canonical
      });
    }

    updateSEO({
      title,
      description,
      canonicalUrl: canonical,
      schemaData: breadcrumbSchema
    });
  }, [activeCategory]);

  const ProductCard = ({ product, index }) => {
    const isOutOfStock = product.stock <= 0;
    const cartItem = cartItems.find(item => item.id === product.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const maxReached = inCartQty >= product.stock;

    return (
      <div 
        className="bg-machineGray/20 rounded-sm overflow-hidden border-2 border-machineGray/50 hover:border-accentOrange transition-all duration-500 flex flex-col group relative animate-mechanical-slide"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="absolute top-0 left-0 z-30 bg-machineGray text-[8px] font-black px-2 py-0.5 text-gray-500 uppercase font-technical">
          REF-{product.id.slice(0, 8)}
        </div>

        <Link to={`/product/${product.id}`} className="relative h-36 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack overflow-hidden flex items-center justify-center border-b border-machineGray/50">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-10">
              <Settings className="w-16 h-16 animate-spin-slow" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Hardware Asset</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-pitchBlack via-transparent to-transparent opacity-80" />

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
            <div className="bg-machineGray/80 backdrop-blur-md px-3 py-1 rounded-sm text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.2em] font-technical">
              {product.category || 'GENUINE PART'}
            </div>
            
            <div className={`px-3 py-1 rounded-sm text-[9px] font-black shadow-lg flex items-center gap-2 uppercase tracking-[0.2em] ${
              isOutOfStock ? 'bg-brakeRed/20 text-brakeRed border border-brakeRed/30' : 'bg-machineryGreen/20 text-machineryGreen border border-machineryGreen/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-brakeRed' : 'bg-machineryGreen'}`} />
              {isOutOfStock ? 'Depleted' : 'Operational'}
            </div>
          </div>
        </Link>

        <div className="p-6 flex flex-col flex-1 relative">
          <div className="mb-6">
            <Link to={`/product/${product.id}`} className="block">
              <h3 className="text-xl font-black text-white leading-tight font-technical uppercase tracking-tighter line-clamp-2">
                {product.name}
              </h3>
            </Link>
            
            {product.description && (
              <p className="text-gray-500 text-xs mt-4 line-clamp-3 leading-relaxed font-utilitarian uppercase tracking-wide border-l-2 border-machineGray pl-4">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-machineGray/30 pt-6">
            <div>
              <span className="text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">MSRP / Unit</span>
              <span className="text-2xl font-black text-white font-technical">
                <span className="text-accentOrange text-sm mr-1">KES</span>
                {product.price.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">Status</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isOutOfStock ? 'text-brakeRed' : 'text-machineryGreen'}`}>
                {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
              </span>
            </div>
          </div>

          <button
            disabled={isOutOfStock || maxReached}
            onClick={() => addToCart(product)}
            className={`mt-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] w-full flex justify-center items-center gap-3 transition-all duration-300 font-technical ${
              isOutOfStock 
                ? 'bg-machineGray/20 text-gray-700 cursor-not-allowed border border-machineGray/50'
                : maxReached
                  ? 'bg-machineGray/40 text-gray-500 cursor-not-allowed border border-machineGray'
                  : 'bg-accentOrange hover:bg-accentOrange/80 text-white shadow-[0_10px_30px_rgba(200,122,62,0.2)] hover:shadow-[0_15px_40px_rgba(200,122,62,0.3)] transform hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isOutOfStock ? 'DEPLETED' : maxReached ? 'LIMIT REACHED' : <>Acquire Part <Plus className="w-3.5 h-3.5" /></>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-pitchBlack text-white flex flex-col font-utilitarian selection:bg-accentOrange/30">
      <Header shopName={settings?.shopName} />

      <div className="bg-machineGray/20 border-b border-machineGray/50 py-3">
        <div className="container mx-auto px-4 max-w-7xl flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase font-technical">
          <Link to="/" className="hover:text-accentOrange flex items-center gap-1 transition">
            <Home className="w-3 h-3" /> Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-600" />
          <Link to="/catalog" className="hover:text-accentOrange transition">Catalog</Link>
          {activeCategory !== 'All' && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <span className="text-accentOrange">{activeCategory}</span>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-16 max-w-7xl">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="h-[2px] w-8 bg-accentOrange" />
              <span className="text-accentOrange text-[10px] font-black uppercase tracking-[0.5em] font-technical">
                Direct Warehouse Parts
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight uppercase font-technical tracking-tighter">
              {activeCategory === 'All' ? 'Parts Catalog' : `${activeCategory} Spares`}
            </h1>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="SEARCH CATALOG SPECIFICALLY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-machineGray/20 border-2 border-machineGray rounded-sm py-4 pl-12 pr-6 text-white placeholder-gray-700 focus:outline-none focus:border-accentOrange transition-all font-technical text-xs tracking-widest uppercase shadow-xl"
            />
          </div>
        </div>

        <div className="mb-16 flex overflow-x-auto pb-4 gap-3 border-b border-machineGray/30 no-scrollbar">
          {categories.map((catName) => {
            const isSelected = activeCategory === catName;
            const catSlug = catName === 'All' ? '' : catName.toLowerCase().replace(/\s+/g, '-');
            return (
              <Link
                key={catName}
                to={catSlug ? `/catalog/${catSlug}` : '/catalog'}
                className={`px-8 py-3.5 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-300 border font-technical ${
                  isSelected
                    ? 'bg-accentOrange text-white border-accentOrange shadow-[0_5px_15px_rgba(255,107,0,0.3)]'
                    : 'bg-machineGray/20 text-gray-500 border-machineGray hover:border-accentOrange hover:text-white'
                }`}
              >
                {catName}
              </Link>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-machineGray rounded-sm flex flex-col items-center justify-center">
            <Search className="w-16 h-16 text-gray-700 mb-6" />
            <h2 className="text-2xl font-black text-white font-technical uppercase tracking-tighter mb-2">No Parts Found</h2>
            <p className="text-gray-500 max-w-sm mx-auto text-xs uppercase tracking-wider mb-8 font-technical">
              No component items found in category "{activeCategory}" matching search query.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-accentOrange text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] font-technical hover:bg-orange-600 transition"
            >
              Clear Search Query
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;
