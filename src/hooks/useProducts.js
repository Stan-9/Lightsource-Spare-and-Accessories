import { useState, useEffect } from 'react';
import { subscribeProducts } from '../services/inventory';

/**
 * Subscribes to the products collection and returns live data.
 *
 * @returns {{ products: object[], loading: boolean }}
 */
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { products, loading };
};

export default useProducts;
