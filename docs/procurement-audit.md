# Phase 0 Audit Report: Procurement Tracking System

**Project:** Gear Link Spares and Accessories (formerly LightSource Motors / Spares)  
**System Architecture:** React 19 · Vite 8 · Firebase Firestore / Auth  
**Audit Date:** 2026-09-29  
**Status:** Approved to proceed with implementation  

---

## 1. Audit Executive Summary

This document fulfills the **Phase 0 Audit Checklist** specified in `supplier/procurement-tracking-plan.md` (§7.1). The audit verified every assumption made in the plan against the active codebase.

Key Conclusion: **The codebase is 100% compatible with the proposed procurement tracking design.**

---

## 2. Checklist Findings & Touchpoint Verification

### A. Data & Schema

#### A1. Products Schema & Sellability
- **File(s):** [src/services/inventory.js](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/services/inventory.js), [src/hooks/useProducts.js](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/hooks/useProducts.js)
- **Finding:** Product documents in Firestore contain: `name`, `price` (selling price), `buyingPrice` (cost price), `minSellPrice`, `stock` (stored integer), `imageUrl`, `category`, `description`, `isVisible` (boolean, default true).
- **Stock Storage:** Stock is a stored scalar property (`stock: number`) on each product document.
- **Risk R1 Mitigation:** We introduce a single pure helper function `isProductSellable(product)`:
  ```js
  export const isProductSellable = (product) => {
    if (!product) return false;
    return Boolean(
      product.price > 0 &&
      product.isVisible !== false
    );
  };
  ```
  Existing products all have valid prices (`price > 0`) and `isVisible !== false`, so no existing products are hidden. Newly received products created during procurement receiving start with `price: 0` and are gated into the **Needs Pricing** queue until the owner sets a valid selling price.

#### A2. Stock Movements
- **File(s):** [src/services/inventory.js](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/services/inventory.js), [src/services/sales.js](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/services/sales.js)
- **Finding:** Stock changes currently happen directly on product documents via `updateDoc` or `transaction.update(productRef, { stock: newStock })`. There is no pre-existing `stockMovements` collection.
- **Action:** We create a dedicated `recordStockMovement()` helper that atomically writes an immutable audit record to `stockMovements` whenever procurement posts a receipt:
  ```ts
  StockMovement {
    id: string                // Deterministic ID: `{receiptId}_{receiptLineId}`
    productId: string
    changeQuantity: number    // Positive for receipts
    stockBefore: number
    stockAfter: number
    type: 'purchase_receipt'  // Enum
    referenceId: string       // receiptId
    createdAt: Timestamp
    createdBy: string
  }
  ```

#### A3. Sales & Cost Snapshot (Risk R2 Protection)
- **File(s):** [src/services/sales.js](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/services/sales.js#L175-L195), [src/pages/AdminDashboard.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/AdminDashboard.jsx#L394-L405)
- **Finding:** In `executeTransaction()`, `buyingPrice` is **already snapshotted** onto each item in `itemsWithCost` at sale time:
  ```js
  buyingPrice: data.buyingPrice || 0
  ```
  And `AdminDashboard.jsx` (Analysis tab) calculates actual net profit directly using `(finalPrice - item.buyingPrice) * item.quantity`.
- **Conclusion:** Historical net profit is **fully protected**. When procurement receiving updates a product's weighted average landed cost (`buyingPrice`), past sales data remains unaltered.

#### A4. Creditor System
- **File(s):** [src/pages/admin-tabs/CreditorsTab.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/admin-tabs/CreditorsTab.jsx), [src/services/sales.js](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/services/sales.js#L407-L435)
- **Finding:** The existing creditor tracker manages **customer credit sales** (accounts receivable) where `paymentType === 'Credit'` and `balanceRemaining > 0`.
- **Conclusion:** There is zero overlap with supplier payables. Procurement collections (`suppliers`, `purchaseOrders`) operate independently.

#### A5. Name Collisions
- **Existing Collections:** `products`, `orders`, `settings`.
- **New Procurement Collections:** `suppliers`, `carriers`, `purchaseOrders`, `purchaseLines`, `shipments`, `receipts`, `receiptLines`, `stockMovements`.
- **Conclusion:** Zero naming collisions.

#### A6. Numbering Pattern
- **Existing Orders:** `REC-` + timestamp or auto Firestore IDs.
- **Purchase Orders:** `PO-YYYY-NNN` (e.g., `PO-2026-001`).

---

### B. Read Paths & Gating

- **B1 Storefront, Catalog & Search:**
  - Read paths: [src/pages/StoreFront.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/StoreFront.jsx), [src/pages/Catalog.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/Catalog.jsx), [src/pages/ProductDetail.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/ProductDetail.jsx), [src/pages/Checkout.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/Checkout.jsx).
  - All read paths will enforce `isProductSellable(product)`.

---

### C. Access & Security

- **C1 Firestore Rules:**
  - File: [firestore.rules](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/firestore.rules)
  - Security configuration:
    - Public read: `products`, `settings`.
    - Admin read/write (`request.auth != null`): `orders`, `suppliers`, `carriers`, `purchaseOrders`, `purchaseLines`, `shipments`, `receipts`, `receiptLines`, `stockMovements`.

---

### D. Platform & Infrastructure

- **D1 Framework:** React 19 · Vite 8 · Tailwind CSS · Lucide React Icons.
- **D2 Write Pattern:** Client-side `runTransaction(db, async (transaction) => { ... })` in Firebase JS SDK v11.
- **D3 Testing:** Vitest (`npm test`).

---

## 3. Implementation Plan Approval & Roadmap

With Phase 0 complete, implementation proceeds sequentially:

- [x] **Phase 0:** Audit & Compatibility Analysis (`docs/procurement-audit.md`)
- [ ] **Phase 1:** Groundwork & Pure Procurement Logic (Data types, derive helper functions, unit tests, sellability gate, Firestore rules, feature flag)
- [ ] **Phase 2:** Record & Track UI (Suppliers, Carriers, PO Management, Cargo Shipments with ETA tracking)
- [ ] **Phase 3:** Receive & Reconcile UI (Receiving screen, expected vs actual check, unexpected quarantine, atomic posting routine with landed cost, Needs Pricing queue)
- [ ] **Phase 4:** Verification & Integration Tests
