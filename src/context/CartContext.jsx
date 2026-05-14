import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('lightsource_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Cart retrieval failed", e);
      return [];
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Save to localStorage whenever cartItems changes
  useEffect(() => {
    localStorage.setItem('lightsource_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Cannot exceed available stock");
          return prev;
        }
        toast.success(`Increased ${product.name} quantity in cart`);
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast.success("Item removed from cart");
  };

  // Update item quantity
  const updateQuantity = (id, newQuantity, maxStock) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxStock) {
      toast.error("Cannot exceed available stock");
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  // Computed values
  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const grandTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isDrawerOpen,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    totalItems,
    grandTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
