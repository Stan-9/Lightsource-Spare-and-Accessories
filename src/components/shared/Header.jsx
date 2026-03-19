import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Header = ({ shopName }) => {
  const { totalItems, toggleDrawer } = useCart();

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
          className="relative p-2 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none"
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-accentOrange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(255,107,0,0.8)] border-2 border-darkBg translate-x-1 -translate-y-1">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
