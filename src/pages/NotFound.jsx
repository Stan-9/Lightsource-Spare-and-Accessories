import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-6 font-poppins relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accentOrange/5 rounded-full blur-[120px]" />

      <div className="relative z-10 text-center max-w-lg">
        <div className="w-24 h-24 bg-accentOrange/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-accentOrange/20">
          <Search className="w-12 h-12 text-accentOrange" />
        </div>

        <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-accentOrange bg-accentOrange/10 border border-accentOrange/20 px-4 py-1.5 rounded-full mb-6">
          404 · Page Not Found
        </span>

        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">
          404
        </h1>
        <h2 className="text-2xl font-black text-gray-300 mb-4 tracking-tight">
          This part doesn't exist
        </h2>
        <p className="text-gray-500 leading-relaxed mb-10 text-sm">
          The page you're looking for couldn't be found. It may have been moved, deleted,
          or the link may be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-accentOrange hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(255,107,0,0.3)]"
          >
            <Home className="w-4 h-4" />
            Back to Store
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition border border-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
