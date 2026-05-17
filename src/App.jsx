import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import StoreFront from './pages/StoreFront';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import Business from './pages/Business';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// The single authorised admin email — set in .env as VITE_ADMIN_EMAIL
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const Spinner = () => (
  <div className="min-h-screen bg-darkBg text-white flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accentOrange" />
  </div>
);

// Admin route — only allows the specific admin email
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  // Must be logged in AND be the designated admin email
  if (!user) return <Navigate to="/admin/login" replace />;
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
    auth.signOut();
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};



function App() {
  return (
    <ErrorBoundary>
      <Router>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#33334d', color: '#fff' },
              success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/" element={<StoreFront />} />
            <Route path="/business" element={<Business />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Admin routes */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
