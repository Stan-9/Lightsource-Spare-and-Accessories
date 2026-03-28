import { useState, useEffect, useMemo } from 'react';
import Header from '../components/shared/Header';
import CartDrawer from '../components/shared/CartDrawer';
import SkeletonCard from '../components/shared/SkeletonCard';
import { subscribeProducts, subscribeSettings } from '../firebase/products';
import { useCart } from '../context/CartContext';
import { Search, Info, Plus, ShoppingCart } from 'lucide-react';

const StoreFront = () => {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ shopName: '', whatsappNumber: '' });
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const ProductCard = ({ product }) => {
    const isOutOfStock = product.stock <= 0;
    const cartItem = cartItems.find(item => item.id === product.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const maxReached = inCartQty >= product.stock;

    return (
      <div className="bg-gray-800/30 rounded-[2rem] overflow-hidden border border-gray-700/50 hover:border-accentOrange/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(255,107,0,0.1)] flex flex-col group relative">
        {/* Badge for items in cart */}
        {inCartQty > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-accentOrange text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/20 animate-in fade-in zoom-in duration-500">
            {inCartQty} IN CART
          </div>
        )}

        <div className="relative h-64 bg-gray-900 overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <ShoppingCart className="w-12 h-12" />
              <span className="text-[10px] font-black uppercase tracking-widest">No Image Available</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-between items-center z-10">
            <div className="bg-darkBg/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white/90 border border-gray-700/50 uppercase tracking-widest">
              {product.category || 'Standard'}
            </div>
            
            <div className={`px-3 py-1 rounded-lg text-[10px] font-black shadow-lg flex items-center gap-1.5 uppercase tracking-widest ${
              isOutOfStock ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
              {isOutOfStock ? 'Out of Stock' : 'Available'}
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1 relative bg-gradient-to-b from-gray-800/10 to-transparent">
          <div className="mb-4">
            <h3 className="text-xl font-black text-white group-hover:text-accentOrange transition-colors duration-300 leading-tight">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-gray-400 text-sm mt-3 line-clamp-2 leading-relaxed font-medium">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-black block tracking-widest mb-1">Price</span>
              <span className="text-2xl font-black text-white tracking-tighter">
                <span className="text-accentOrange text-sm mr-1">KES</span>
                {product.price.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold bg-gray-900/80 px-2 py-1 rounded-md border border-gray-700/50">
                {product.stock} units
              </span>
            </div>
          </div>

          <button
            disabled={isOutOfStock || maxReached}
            onClick={() => addToCart(product)}
            className={`mt-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest w-full flex justify-center items-center gap-2 transition-all duration-500 ${
              isOutOfStock 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                : maxReached
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
                  : 'bg-accentOrange hover:bg-orange-600 text-white shadow-[0_10px_30px_rgba(255,107,0,0.3)] hover:shadow-[0_15px_40px_rgba(255,107,0,0.5)] transform hover:-translate-y-1 active:scale-95'
            }`}
          >
            {isOutOfStock 
              ? 'Sold Out' 
              : maxReached 
                ? 'Max in Cart' 
                : (
                  <>
                    Add To Cart
                    <Plus className="w-4 h-4" />
                  </>
                )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-poppins selection:bg-accentOrange/30">
      <Header shopName={settings?.shopName} />
      <CartDrawer whatsappNumber={settings?.whatsappNumber} />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-gray-800/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accentOrange/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
          <div className="max-w-3xl">
            <span className="inline-block bg-accentOrange/10 text-accentOrange text-[10px] font-black px-4 py-1.5 rounded-full border border-accentOrange/20 uppercase tracking-[0.3em] mb-6">
              Genuine Motorbike Spare Parts
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-8 tracking-tighter">
              Performance <span className="text-accentOrange">Meets</span> <br className="hidden md:block" /> Reliability.
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl mb-10 leading-relaxed">
              Find the perfect parts for your ride. We provide high-quality spare parts and accessories with fast delivery across the country.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by part name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/40 border border-gray-700/50 rounded-2xl py-4 sm:py-5 pl-12 pr-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accentOrange/50 focus:border-accentOrange transition-all backdrop-blur-md shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        {/* Filter Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">Our Collection</h2>
            <p className="text-gray-500 text-sm font-medium">Browse through {products.length} available items</p>
          </div>

          <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar scroll-smooth">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border ${
                  activeCategory === category
                    ? 'bg-accentOrange text-white border-accentOrange shadow-[0_10px_20px_rgba(255,107,0,0.2)]'
                    : 'bg-gray-800/30 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-900/30 rounded-[3rem] border border-gray-800/50 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accentOrange/5 rounded-full blur-3xl opacity-20" />
            <div className="w-24 h-24 bg-gray-800 flex items-center justify-center mb-8 rounded-[2rem] shadow-inner rotate-12 group hover:rotate-0 transition-transform duration-500">
              <Search className="w-10 h-10 text-gray-600 group-hover:text-accentOrange transition-colors" />
            </div>
            <h2 className="text-3xl font-black text-gray-300 mb-4">No parts found</h2>
            <p className="text-gray-500 max-w-md mx-auto font-medium mb-10 leading-relaxed px-6">
              We couldn't find any items matching your current filters. Try adjusting your search or category.
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="bg-accentOrange hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-accentOrange/20 active:scale-95"
              >
                Reset Search
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-12 bg-black/40 text-center mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-accentOrange flex items-center justify-center font-black text-white shadow-xl shadow-accentOrange/20 text-xl">
              {settings?.shopName ? settings.shopName.charAt(0) : 'L'}
            </div>
            <h2 className="text-white font-black text-xl tracking-tight">
              {settings.shopName || "LightSource Motors"}
            </h2>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              Premium motorbike spare parts and high-quality accessories delivered to your doorstep.
            </p>
            <div className="h-px w-24 bg-gray-800" />
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} {settings.shopName || "LightSource Motors"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StoreFront;
