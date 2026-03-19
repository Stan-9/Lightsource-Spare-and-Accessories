import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import StoreFront from './pages/StoreFront';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// Protected Route Component for Admin Dashboard
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

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accentOrange"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <Router>
      <CartProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#33334d',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#FF6B00',
                secondary: '#fff',
              },
            },
          }} 
        />
        <Routes>
          <Route path="/" element={<StoreFront />} />
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
        </Routes>
      </CartProvider>
    </Router>
  );
}

export default App;
