import { Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { normalizeOrder } from '../../services/sales';

/**
 * MigrationPanel Component
 * Handles one-time database schema migration for legacy orders with pre-migration JSON backup.
 */
const MigrationPanel = ({ orders }) => {
  const handleMigrate = async () => {
    try {
      // 1. Export JSON backup automatically
      const jsonContent = JSON.stringify(orders, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `orders_backup_${Date.now()}.json`);
      a.click();
      toast.success("Pre-migration backup downloaded!");

      // 2. Perform idempotent migration
      let migratedCount = 0;
      for (const rawOrder of orders) {
        if (!rawOrder.fulfillmentStatus && rawOrder.id) {
          const norm = normalizeOrder(rawOrder);
          const orderRef = doc(db, 'orders', rawOrder.id);
          await updateDoc(orderRef, {
            fulfillmentStatus: norm.fulfillmentStatus,
            paymentStatus: norm.paymentStatus,
            isCredit: norm.isCredit,
            status: norm.fulfillmentStatus === 'fulfilled' 
              ? (norm.paymentStatus === 'paid' ? 'completed' : 'pending')
              : 'cancelled'
          });
          migratedCount++;
        }
      }
      toast.success(`Migration completed! ${migratedCount} legacy orders updated.`);
    } catch (error) {
      console.error(error);
      toast.error("Migration failed: " + error.message);
    }
  };

  return (
    <div className="pt-6 mt-6 border-t border-gray-800">
      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
        <Database className="w-4 h-4 text-accentOrange" />
        Database Schema Migration
      </h4>
      <p className="text-xs text-gray-400 mb-4">
        Run a one-time migration to upgrade legacy orders to the new fulfillment and payment schema. 
        An automatic JSON backup will download before migration begins. Safe to run multiple times.
      </p>
      <button
        type="button"
        onClick={handleMigrate}
        className="px-6 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition"
      >
        Backup & Migrate Legacy Orders
      </button>
    </div>
  );
};

export default MigrationPanel;
