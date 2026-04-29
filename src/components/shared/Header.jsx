import { ShoppingCart, User, LogOut, Briefcase } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

const Header = ({ shopName }) => {
  const { totalItems, grandTotal, toggleDrawer } = useCart();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-darkBg/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl shrink-0 bg-accentOrange flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(255,107,0,0.3)] group-hover:scale-110 transition-transform">
              {shopName ? shopName.charAt(0) : 'L'}
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white hidden sm:block uppercase">
              {shopName || "LightSource"}
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-white transition">Shop</Link>
            <Link to="/business" className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-white transition">Business</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-gray-900/50 p-1.5 pr-4 rounded-full border border-gray-800">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <User className="w-4 h-4 text-accentOrange" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[80px]">
                {user.email.split('@')[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-gray-600 hover:text-red-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="p-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition"
              title="Sign In"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          <div className="h-8 w-px bg-gray-800 mx-2" />

          <button 
            onClick={toggleDrawer}
            className="relative group p-2.5 rounded-xl flex items-center justify-center focus:outline-none transition-all duration-300 hover:bg-gray-800/80 active:scale-95 border border-transparent hover:border-gray-700 bg-gray-900/30"
          >
            <div className="flex items-center gap-3">
              {totalItems > 0 && (
                <span className="hidden md:block text-xs font-black text-accentOrange">
                  KES {grandTotal.toLocaleString()}
                </span>
              )}
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-white transition-transform group-hover:-rotate-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-accentOrange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)] border-2 border-darkBg animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

