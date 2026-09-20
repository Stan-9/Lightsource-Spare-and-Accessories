import { useState, useEffect } from 'react';
import { subscribeOrders } from '../services/sales';

/**
 * Subscribes to the orders collection (newest-first) and returns live data.
 *
 * @returns {{ orders: object[], ordersLoading: boolean }}
 */
export const useOrders = () => {
  const [orders, setOrders]           = useState([]);
  const [ordersLoading, setLoading]   = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { orders, ordersLoading };
};

export default useOrders;
