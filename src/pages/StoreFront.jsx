import { useState, useEffect, useMemo } from 'react';
import Header from '../components/shared/Header';
import CartDrawer from '../components/shared/CartDrawer';
import SkeletonCard from '../components/shared/SkeletonCard';
import { subscribeProducts, subscribeSettings } from '../firebase/products';
import { useCart } from '../context/CartContext';
import { Search, Info } from 'lucide-react';

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
      <div className="bg-gray-800/40 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-accentOrange/50 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,107,0,0.15)] flex flex-col group">
        <div className="relative h-56 bg-gray-900 border-b border-gray-800 flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <span className="text-gray-500 font-medium">No Image</span>
          )}
          
          <div className="absolute top-3 left-3 bg-darkBg/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg border border-gray-700">
            {product.category || 'Uncategorized'}
          </div>

          {!isOutOfStock && inCartQty > 0 && (
            <div className="absolute top-3 right-3 bg-accentOrange px-2 py-1 rounded-md text-xs font-bold text-white shadow-[0_0_10px_rgba(255,107,0,0.8)]">
              {inCartQty} in cart
            </div>
          )}
          
          <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 ${
            isOutOfStock ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-gray-100 line-clamp-2 leading-tight">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="text-accentOrange font-black text-xl tracking-tight">
              KES {product.price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-xs font-medium bg-gray-900 px-2 py-1 rounded-md">
              {product.stock} left
            </span>
          </div>

          <button
            disabled={isOutOfStock || maxReached}
            onClick={() => addToCart(product)}
            className={`mt-4 py-3 rounded-xl font-bold w-full flex justify-center items-center gap-2 transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : maxReached
                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed border border-gray-600'
                  : 'bg-accentOrange hover:bg-orange-600 text-white shadow-[0_4px_14px_0_rgba(255,107,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.5)] transform hover:-translate-y-0.5'
            }`}
          >
            {isOutOfStock 
              ? 'Sold Out' 
              : maxReached 
                ? 'Max Stock Added' 
                : 'Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-poppins section-container selection:bg-accentOrange/30">
      <Header shopName={settings?.shopName} />
      <CartDrawer whatsappNumber={settings?.whatsappNumber} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Search and Filter Section */}
        <div className="mb-10 space-y-6">
          <div className="relative max-w-md mx-auto sm:mx-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search parts by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accentOrange/50 focus:border-accentOrange transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
            />
          </div>

          {/* Categories */}
          {categories.length > 1 && (
            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar scroll-smooth">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 border ${
                    activeCategory === category
                      ? 'bg-accentOrange text-white border-accentOrange shadow-[0_0_15px_rgba(255,107,0,0.3)]'
                      : 'bg-gray-800/30 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-900/20 rounded-3xl border border-gray-800/50 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Info className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No Parts Found</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any items matching your current filters. Try adjusting your search or category.
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-6 text-accentOrange font-medium hover:underline flex items-center gap-1"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-8 bg-black/20 text-center mt-auto">
        <p className="text-gray-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} {settings.shopName || "LightSource Motors"}. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default StoreFront;
