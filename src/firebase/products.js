export * from '../services/inventory';
export * from '../services/sales';
export * from '../services/config';

// Compatibility Layer
import { executeTransaction } from '../services/sales';
export const processManualSale = executeTransaction;
