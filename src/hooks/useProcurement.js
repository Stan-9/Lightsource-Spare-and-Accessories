import { useState, useEffect } from 'react';
import {
  subscribeSuppliers,
  subscribeCarriers,
  subscribePurchaseOrders,
  subscribePurchaseLines,
  subscribeShipments,
  subscribeReceipts,
  subscribeReceiptLines,
} from '../services/procurement/procurementService';

export const useProcurement = () => {
  const [suppliers, setSuppliers]           = useState([]);
  const [carriers, setCarriers]             = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseLines, setPurchaseLines]   = useState([]);
  const [shipments, setShipments]           = useState([]);
  const [receipts, setReceipts]             = useState([]);
  const [receiptLines, setReceiptLines]     = useState([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 5) setLoading(false);
    };

    const unsubSuppliers = subscribeSuppliers(data => { setSuppliers(data); checkLoaded(); });
    const unsubCarriers  = subscribeCarriers(data => { setCarriers(data); checkLoaded(); });
    const unsubPOs       = subscribePurchaseOrders(data => { setPurchaseOrders(data); checkLoaded(); });
    const unsubPLines    = subscribePurchaseLines(data => { setPurchaseLines(data); checkLoaded(); });
    const unsubShipments = subscribeShipments(data => { setShipments(data); checkLoaded(); });
    const unsubReceipts  = subscribeReceipts(data => { setReceipts(data); });
    const unsubRLines    = subscribeReceiptLines(data => { setReceiptLines(data); });

    return () => {
      unsubSuppliers();
      unsubCarriers();
      unsubPOs();
      unsubPLines();
      unsubShipments();
      unsubReceipts();
      unsubRLines();
    };
  }, []);

  return {
    suppliers,
    carriers,
    purchaseOrders,
    purchaseLines,
    shipments,
    receipts,
    receiptLines,
    loading,
  };
};
