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
    <header className="sticky top-0 z-40 bg-pitchBlack/95 backdrop-blur-sm border-b-2 border-machineGray/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-sm shrink-0 bg-accentOrange flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(255,107,0,0.3)] group-hover:rotate-90 transition-transform duration-500">
              {shopName ? shopName.charAt(0) : 'L'}
            </div>
            <h1 className="text-xl font-black tracking-[0.2em] text-white hidden sm:block uppercase font-technical">
              {shopName || "LightSource"}
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-accentOrange transition-colors">Shop</Link>
            <Link to="/business" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-accentOrange transition-colors">Business</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-machineGray/30 p-1.5 pr-4 rounded-sm border border-machineGray">
              <div className="w-8 h-8 rounded-sm bg-machineGray/50 flex items-center justify-center">
                <User className="w-4 h-4 text-accentOrange" />
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] truncate max-w-[80px]">
                {user.email.split('@')[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-gray-600 hover:text-brakeRed transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="p-2.5 rounded-sm border border-machineGray text-gray-400 hover:text-white hover:border-accentOrange transition-all"
              title="Sign In"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          <div className="h-10 w-[2px] bg-machineGray/50 mx-2" />

          <button 
            onClick={toggleDrawer}
            className="relative group p-2.5 rounded-sm flex items-center justify-center focus:outline-none transition-all duration-300 hover:bg-accentOrange/10 active:scale-95 border-2 border-machineGray hover:border-accentOrange"
          >
            <div className="flex items-center gap-3">
              {totalItems > 0 && (
                <span className="hidden md:block text-[10px] font-black text-accentOrange font-technical">
                  KES {grandTotal.toLocaleString()}
                </span>
              )}
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
                {totalItems > 0 && (
                  <span className="absolute -top-4 -right-4 bg-brakeRed text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,0,0,0.5)] border border-white/20 animate-bounce">
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

