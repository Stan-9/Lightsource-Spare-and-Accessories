import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/shared/Header';
import SkeletonCard from '../components/shared/SkeletonCard';
import { subscribeProducts, subscribeSettings } from '../firebase/products';
import { useCart } from '../context/CartContext';
import { ShieldCheck, Settings, Plus, Home, ChevronRight, ShoppingCart } from 'lucide-react';
import { updateSEO } from '../services/seo';

const Brands = () => {
  const { brand: routeBrand } = useParams();
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ shopName: '' });
  const [loading, setLoading] = useState(true);
  
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

  // Standard motorcycle/spare brands
  const defaultBrands = ['GIVI', 'YAMAHA', 'HONDA', 'TVS', 'BAJAJ', 'SUZUKI', 'GENUINE OEM'];

  const allBrands = useMemo(() => {
    const dbBrands = products.map(p => p.brand).filter(Boolean);
    const combined = [...new Set([...dbBrands, ...defaultBrands])];
    return combined.sort();
  }, [products]);

  const activeBrand = useMemo(() => {
    if (!routeBrand) return null;
    const cleanRouteBrand = routeBrand.replace(/-/g, ' ').toLowerCase();
    const found = allBrands.find(b => b.toLowerCase() === cleanRouteBrand);
    return found || routeBrand.toUpperCase();
  }, [routeBrand, allBrands]);

  const brandProducts = useMemo(() => {
    if (!activeBrand) return [];
    return products.filter(p => {
      const matchBrand = (p.brand && p.brand.toLowerCase() === activeBrand.toLowerCase()) || 
                         (activeBrand.toLowerCase() === 'genuine oem' && !p.brand);
      const isVisible = p.isVisible !== false;
      return matchBrand && isVisible;
    });
  }, [products, activeBrand]);

  // SEO Optimization
  useEffect(() => {
    const title = activeBrand 
      ? `Genuine ${activeBrand} Spare Parts` 
      : 'Featured Motorbike Spare Brands';
    const description = activeBrand
      ? `Shop authentic spare parts manufactured by ${activeBrand}. Heavy-duty, high-performance parts distributed by LightSource Motors.`
      : 'Discover our directory of featured motorbike parts manufacturers. Genuine parts guaranteed.';
    const canonical = `${window.location.origin}/brands${activeBrand ? `/brand/${activeBrand.toLowerCase().replace(/\s+/g, '-')}` : ''}`;

    updateSEO({
      title,
      description,
      canonicalUrl: canonical,
      schemaData: {
        "@context": "https://schema.org",
        "@type": "Brand",
        "name": activeBrand || "LightSource Genuine Brands",
        "description": description
      }
    });
  }, [activeBrand]);

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
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-10">
              <Settings className="w-8 h-8 animate-spin-slow" />
              <span className="text-[8px] font-black uppercase font-technical">Asset Item</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-pitchBlack via-transparent to-transparent opacity-80" />
        </Link>

        <div className="p-4 flex flex-col flex-1">
          <Link to={`/product/${product.id}`} className="block mb-2">
            <h3 className="text-xs sm:text-base font-black text-white group-hover:text-accentOrange transition-colors uppercase font-technical line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto flex justify-between items-end border-t border-machineGray/30 pt-4">
            <div>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block font-technical">Price</span>
              <span className="text-sm sm:text-base font-black text-white font-technical">KES {product.price.toLocaleString()}</span>
            </div>
            <span className={`text-[10px] font-black uppercase font-technical ${isOutOfStock ? 'text-brakeRed' : 'text-machineryGreen'}`}>
              {isOutOfStock ? 'Depleted' : 'In Stock'}
            </span>
          </div>

          <button
            disabled={isOutOfStock || maxReached}
            onClick={() => addToCart(product)}
            className={`mt-4 py-2 rounded-sm font-black text-[9px] uppercase tracking-wider w-full flex justify-center items-center gap-2 transition font-technical ${
              isOutOfStock 
                ? 'bg-machineGray/20 text-gray-700 cursor-not-allowed border border-machineGray/50'
                : 'bg-accentOrange text-white hover:bg-accentOrange/80 shadow-md'
            }`}
          >
            Acquire Part <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian selection:bg-accentOrange/30">
      <Header shopName={settings?.shopName} />

      {/* Breadcrumbs */}
      <nav className="container mx-auto px-4 py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 font-technical border-b border-machineGray/30">
        <Link to="/" className="hover:text-accentOrange flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <Link to="/brands" className="hover:text-accentOrange">Brands</Link>
        {activeBrand && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            <span className="text-accentOrange">{activeBrand}</span>
          </>
        )}
      </nav>

      {!activeBrand ? (
        // Directory View
        <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl font-black font-technical uppercase tracking-tighter mb-4 text-white">
              Featured Spare Brands
            </h1>
            <p className="text-gray-500 text-sm uppercase tracking-wider">
              Procure certified performance spares directly sorted by official parts manufacturers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {allBrands.map((brand) => {
              // count matching items
              const count = products.filter(p => p.brand?.toLowerCase() === brand.toLowerCase() || (brand.toLowerCase() === 'genuine oem' && !p.brand)).length;
              return (
                <Link
                  key={brand}
                  to={`/brand/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-machineGray/20 border-2 border-machineGray/50 hover:border-accentOrange hover:shadow-[0_0_20px_rgba(200,122,62,0.1)] p-8 rounded-sm transition flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-12 h-12 bg-machineGray/40 rounded-full flex items-center justify-center border border-machineGray group-hover:bg-accentOrange/10 group-hover:border-accentOrange transition mb-4">
                    <ShieldCheck className="w-6 h-6 text-accentOrange" />
                  </div>
                  <h3 className="text-lg font-black font-technical uppercase text-white tracking-wider group-hover:text-accentOrange transition-colors">
                    {brand}
                  </h3>
                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] font-technical mt-2">
                    {count} Block Components cataloged
                  </span>
                </Link>
              );
            })}
          </div>
        </main>
      ) : (
        // Brand Detail Listings View
        <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
          <div className="border-b border-machineGray/40 pb-8 mb-12">
            <h1 className="text-4xl sm:text-6xl font-black font-technical uppercase tracking-tighter text-white">
              {activeBrand} Registry
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-widest mt-2">
              Showing official listings cataloged for brand: {activeBrand}. Total parts: {brandProducts.length}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : brandProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {brandProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-machineGray rounded-sm">
              <Settings className="w-12 h-12 text-gray-600 animate-spin-slow mx-auto mb-4" />
              <h3 className="text-xl font-black font-technical uppercase text-white">Empty Registry Block</h3>
              <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">
                No active parts listed for {activeBrand} yet.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default Brands;
