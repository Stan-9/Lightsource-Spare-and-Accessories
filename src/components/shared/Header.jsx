import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Header = ({ shopName }) => {
  const { totalItems, grandTotal, toggleDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-darkBg/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* A simple mechanical inspired logo representation */}
          <div className="w-8 h-8 rounded shrink-0 bg-accentOrange flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(255,107,0,0.5)]">
            {shopName ? shopName.charAt(0) : 'L'}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
            {shopName || "LightSource Motors"}
          </h1>
        </div>

        <button 
          onClick={toggleDrawer}
          className="relative group p-2 rounded-xl flex items-center justify-center focus:outline-none transition-all duration-300 hover:bg-gray-800/80 active:scale-95 border border-transparent hover:border-gray-700"
        >
          <div className="flex items-center gap-3">
            {totalItems > 0 && (
              <span className="hidden md:block text-xs font-semibold text-gray-400">
                KES {grandTotal.toLocaleString()}
              </span>
            )}
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-white transition-transform group-hover:-rotate-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-accentOrange text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_12px_rgba(255,107,0,0.6)] border-2 border-darkBg animate-in zoom-in duration-300">
                  {totalItems}
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
