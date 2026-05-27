import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/shared/Header';
import SkeletonCard from '../components/shared/SkeletonCard';
import { subscribeProducts, subscribeSettings } from '../firebase/products';
import { useCart } from '../context/CartContext';
import { Search, Plus, Settings, ChevronRight, Home } from 'lucide-react';
import { updateSEO } from '../services/seo';

const Catalog = () => {
  const { category: routeCategory } = useParams();
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ shopName: '', whatsappNumber: '' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    const unsubProducts = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });

    const unsubSettings = subscribeSettings((data) => {
      setSettings(data);
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => p.category))];
    return ['All', ...uniqueCats.filter(Boolean).sort()];
  }, [products]);

  // Decode and match category
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
      const isVisible = p.isVisible !== false;
      return matchSearch && matchCategory && isVisible;
    });
  }, [products, searchQuery, activeCategory]);

  // SEO Updates dynamically
  useEffect(() => {
    const title = activeCategory === 'All' 
      ? 'Genuine Motorbike Parts Catalog' 
      : `${activeCategory} Parts Catalog`;
    const description = `Browse our selection of genuine motorbike ${activeCategory.toLowerCase()} parts. LightSource Motors offers top-grade components in Kenya.`;
    const canonical = `${window.location.origin}/catalog${activeCategory !== 'All' ? `/${activeCategory.toLowerCase().replace(/\s+/g, '-')}` : ''}`;
    
    // Breadcrumb list schema
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
        className="bg-machineGray/20 rounded-sm overflow-hidden border-2 border-machineGray/50 hover:border-accentOrange transition-all duration-500 hover:shadow-[0_0_30px_rgba(200,122,62,0.15)] flex flex-col group relative animate-mechanical-slide"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="absolute top-0 left-0 z-30 bg-machineGray text-[8px] font-black px-2 py-0.5 text-gray-500 uppercase font-technical">
          REF-{product.id.slice(0, 8)}
        </div>

        {inCartQty > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-accentOrange text-white text-[9px] font-black px-3 py-1 rounded-sm shadow-lg border border-white/20 animate-bounce">
            {inCartQty} UNIT(S) RESERVED
          </div>
        )}

        {/* Link to product detail page */}
        <Link to={`/product/${product.id}`} className="relative h-36 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack overflow-hidden flex items-center justify-center border-b border-machineGray/50">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-10">
              <Settings className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 animate-spin-slow" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Hardware Asset</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-pitchBlack via-transparent to-transparent opacity-80" />

          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex flex-col sm:flex-row gap-1 sm:gap-2 justify-between items-start sm:items-center z-10">
            <div className="bg-machineGray/80 backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-sm text-[7px] sm:text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.2em] font-technical">
              {product.category || 'GENUINE PART'}
            </div>
            
            <div className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-sm text-[7px] sm:text-[9px] font-black shadow-lg flex items-center gap-1 sm:gap-2 uppercase tracking-[0.2em] ${
              isOutOfStock ? 'bg-brakeRed/20 text-brakeRed border border-brakeRed/30' : 'bg-machineryGreen/20 text-machineryGreen border border-machineryGreen/30'
            }`}>
              <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isOutOfStock ? 'bg-brakeRed' : 'bg-machineryGreen'}`} />
              {isOutOfStock ? 'Depleted' : 'Operational'}
            </div>
          </div>
        </Link>

        <div className="p-2 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1 relative">
          <div className="mb-2 sm:mb-6">
            <Link to={`/product/${product.id}`} className="block">
              <h3 className="text-xs sm:text-base md:text-lg lg:text-xl font-black text-white group-hover:text-accentOrange transition-colors duration-300 leading-tight font-technical uppercase tracking-tighter line-clamp-2">
                {product.name}
              </h3>
            </Link>
            
            {product.description && (
              <p className="hidden sm:block text-gray-500 text-xs mt-4 line-clamp-3 leading-relaxed font-utilitarian uppercase tracking-wide border-l-2 border-machineGray pl-4">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between border-t border-machineGray/30 pt-3 sm:pt-6 gap-2">
            <div>
              <span className="hidden sm:block text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">MSRP / Unit</span>
              <span className="text-sm sm:text-xl md:text-2xl font-black text-white font-technical">
                <span className="text-accentOrange text-[10px] sm:text-sm mr-0.5 sm:mr-1">KES</span>
                {product.price.toLocaleString()}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="hidden sm:block text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">Status</span>
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${isOutOfStock ? 'text-brakeRed' : 'text-machineryGreen'}`}>
                {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
              </span>
            </div>
          </div>

          <button
            disabled={isOutOfStock || maxReached}
            onClick={() => addToCart(product)}
            className={`mt-4 py-2.5 sm:py-4 rounded-sm font-black text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] w-full flex justify-center items-center gap-1.5 sm:gap-3 transition-all duration-300 font-technical ${
              isOutOfStock 
                ? 'bg-machineGray/20 text-gray-700 cursor-not-allowed border border-machineGray/50'
                : maxReached
                  ? 'bg-machineGray/40 text-gray-500 cursor-not-allowed border border-machineGray'
                  : 'bg-accentOrange hover:bg-accentOrange/80 text-white shadow-[0_10px_30px_rgba(200,122,62,0.15)] hover:shadow-[0_15px_40px_rgba(200,122,62,0.3)] transform hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isOutOfStock 
              ? 'DEPLETED' 
              : maxReached 
                ? 'LIMIT' 
                : (
                  <>
                    <span className="hidden sm:inline">Acquire Part</span>
                    <span className="inline sm:hidden">Acquire</span>
                    <Plus className="w-3.5 h-3.5" />
                  </>
                )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian selection:bg-accentOrange/30">
      <Header shopName={settings?.shopName} />

      {/* Breadcrumbs for SEO and navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500 font-technical">
        <Link to="/" className="hover:text-accentOrange flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <Link to="/catalog" className={`hover:text-accentOrange ${activeCategory === 'All' ? 'text-accentOrange' : ''}`}>
          Catalog
        </Link>
        {activeCategory !== 'All' && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            <span className="text-accentOrange">{activeCategory}</span>
          </>
        )}
      </nav>

      {/* Catalog Main Header */}
      <section className="relative overflow-hidden py-12 border-b border-machineGray/50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-none mb-6 tracking-tighter font-technical uppercase">
              {activeCategory === 'All' ? 'Part Catalog' : activeCategory}
            </h1>
            <p className="text-gray-500 text-sm md:text-base font-medium max-w-xl mb-8 uppercase tracking-tight leading-relaxed">
              Explore professional-grade components for your motorbike. High performance, genuine compatibility.
            </p>
            
            <div className="relative max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <Search className="w-4 h-4 text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="SEARCH CATALOGED PARTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-machineGray/10 border-2 border-machineGray rounded-sm py-4 pl-12 pr-6 text-white placeholder-gray-700 focus:outline-none focus:border-accentOrange transition-all font-technical text-xs tracking-widest uppercase"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation Pills */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-10 flex overflow-x-auto pb-4 gap-4 no-scrollbar scroll-smooth border-b border-machineGray/30">
          {categories.map((cat) => {
            const path = cat === 'All' ? '/catalog' : `/catalog/${cat.toLowerCase().replace(/\s+/g, '-')}`;
            const isActive = activeCategory === cat;
            return (
              <Link
                key={cat}
                to={path}
                className={`px-6 py-3.5 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-300 border-2 font-technical ${
                  isActive
                    ? 'bg-accentOrange text-white border-accentOrange shadow-[0_10px_25px_rgba(200,122,62,0.25)]'
                    : 'bg-transparent text-gray-500 border-machineGray hover:border-accentOrange hover:text-white'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 lg:gap-12">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 lg:gap-12">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-machineGray rounded-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-machineGray/20 flex items-center justify-center mb-6 rounded-sm border border-machineGray rotate-45">
              <Search className="w-6 h-6 text-gray-700 -rotate-45" />
            </div>
            <h2 className="text-2xl font-black text-white font-technical uppercase tracking-tighter mb-2">No Items Located</h2>
            <p className="text-gray-600 max-w-xs mx-auto font-black text-[9px] uppercase tracking-[0.2em]">
              Refine your filters or search keywords.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;
