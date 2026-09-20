import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/shared/Header';
import SkeletonCard from '../components/shared/SkeletonCard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../hooks/useProducts';
import { useSettings } from '../context/SettingsContext';
import { ShieldCheck, Settings, Plus, Home, ChevronRight } from 'lucide-react';
import { updateSEO } from '../services/seo';

const Brands = () => {
  const { brand: routeBrand } = useParams();
  const { products, loading } = useProducts();
  const { settings } = useSettings();
  
  const { addToCart, cartItems } = useCart();

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

      {/* Breadcrumb Navigation */}
      <div className="bg-machineGray/20 border-b border-machineGray/50 py-3">
        <div className="container mx-auto px-4 max-w-7xl flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase font-technical">
          <Link to="/" className="hover:text-accentOrange flex items-center gap-1 transition">
            <Home className="w-3 h-3" /> Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-600" />
          <Link to="/brands" className="hover:text-accentOrange transition">Brands</Link>
          {activeBrand && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <span className="text-accentOrange">{activeBrand}</span>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-16 max-w-7xl">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <span className="h-[2px] w-8 bg-accentOrange" />
            <span className="text-accentOrange text-[10px] font-black uppercase tracking-[0.5em] font-technical">
              Verified Manufacturers
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight uppercase font-technical tracking-tighter">
            {activeBrand ? `${activeBrand} Parts` : 'Manufacturer Directory'}
          </h1>
          <p className="text-gray-500 text-sm mt-4 max-w-2xl uppercase tracking-wider font-utilitarian leading-relaxed">
            Select an authorized motorcycle manufacturer to filter certified components, replacement parts, and OEM spares.
          </p>
        </div>

        {/* Brand Filter Pills */}
        <div className="mb-16 flex flex-wrap gap-3 border-b border-machineGray/30 pb-8">
          <Link
            to="/brands"
            className={`px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all border font-technical ${
              !activeBrand 
                ? 'bg-accentOrange text-white border-accentOrange shadow-[0_5px_15px_rgba(255,107,0,0.3)]'
                : 'bg-machineGray/20 text-gray-400 border-machineGray hover:border-accentOrange hover:text-white'
            }`}
          >
            All Manufacturers
          </Link>
          {allBrands.map((brandName) => {
            const isSelected = activeBrand?.toLowerCase() === brandName.toLowerCase();
            const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
            return (
              <Link
                key={brandName}
                to={`/brand/${brandSlug}`}
                className={`px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all border font-technical ${
                  isSelected
                    ? 'bg-accentOrange text-white border-accentOrange shadow-[0_5px_15px_rgba(255,107,0,0.3)]'
                    : 'bg-machineGray/20 text-gray-400 border-machineGray hover:border-accentOrange hover:text-white'
                }`}
              >
                {brandName}
              </Link>
            );
          })}
        </div>

        {/* Content Display */}
        {!activeBrand ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBrands.map((brandName) => {
              const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
              const count = products.filter(p => (p.brand && p.brand.toLowerCase() === brandName.toLowerCase()) || (brandName.toLowerCase() === 'genuine oem' && !p.brand)).length;
              return (
                <Link
                  key={brandName}
                  to={`/brand/${brandSlug}`}
                  className="bg-machineGray/10 border-2 border-machineGray p-8 rounded-sm hover:border-accentOrange transition-all duration-300 group flex flex-col justify-between h-48 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accentOrange/5 rounded-full blur-2xl group-hover:bg-accentOrange/10 transition" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <ShieldCheck className="w-8 h-8 text-accentOrange" />
                      <span className="text-[10px] font-black text-gray-500 font-technical uppercase tracking-widest">
                        {count} Components Listed
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase font-technical group-hover:text-accentOrange transition">
                      {brandName}
                    </h3>
                  </div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] font-technical flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    Explore Catalog <ChevronRight className="w-3 h-3 text-accentOrange" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : brandProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brandProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-machineGray rounded-sm flex flex-col items-center justify-center">
            <ShieldCheck className="w-16 h-16 text-gray-700 mb-6" />
            <h2 className="text-2xl font-black text-white font-technical uppercase tracking-tighter mb-2">
              No Direct {activeBrand} Items Found
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-xs uppercase tracking-wider mb-8 font-technical">
              We are constantly restocking our warehouse catalog. Contact our sales team directly for unlisted {activeBrand} spares.
            </p>
            <Link
              to="/brands"
              className="bg-accentOrange text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] font-technical hover:bg-orange-600 transition"
            >
              Back to Manufacturers Directory
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Brands;
