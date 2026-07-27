# Technical Documentation: Order Status, Inventory Sync, Creditor Payments, and System Rebranding

## Overview
This document details the architectural fixes and enhancements implemented for **Gear Link Spares and Accessories** (formerly LightSource Spares).

---

## 1. System Rebranding
* **Title & Branding:** System display name updated from *LightSource Motors / Spares* to **Gear Link Spares and Accessories** across `index.html`, `src/services/config.js`, `src/components/Footer.jsx`, and `src/pages/AdminDashboard.jsx`.

---

## 2. Order Status Definitions & State Management

| Status | Description | Inventory Action | Business Analysis (Revenue) |
|---|---|---|---|
| **Pending** | Order is placed but not yet fully paid (default for Credit orders and unpaid Checkout orders). | Stock **deducted immediately** at creation. | **Excluded** from revenue/profit calculations until fully paid. |
| **Completed** | Order is fully paid (Paid at creation or paid off later). | Stock **NOT deducted again**. | **Recorded** into revenue and net profit calculation. |
| **Cancelled** | Order is cancelled at any stage. | Stock **RESTORED** back to product inventory automatically via Firestore transaction. | **Excluded** / reversed from revenue calculations. |

---

## 3. Stock Deduction & Restoration Logic
* **Stock Deduction on Creation:** Executed atomically in `executeTransaction()` (`src/services/sales.js`).
* **Stock Restoration on Cancellation:** Handled atomically in `updateOrderStatus()` (`src/services/sales.js`):
  - Transitioning to `'cancelled'`: Reads order items and increments product stock by `item.quantity`.
  - Re-activating from `'cancelled'`: Re-deducts product stock.

---

## 4. Partial Payments & Creditor Sync Logic

### Data Schema Enhancements (`orders` Collection)
Each order document in Firestore now supports the following fields:
* `paymentType`: `'Cash'` | `'Credit'`
* `paymentStatus`: `'Paid'` | `'Unpaid'`
* `status`: `'pending'` | `'completed'` | `'cancelled'`
* `amountPaid`: Running total of payments collected (default: `total` for Paid, `0` for Unpaid/Credit).
* `balanceRemaining`: Outstanding debt (`net_total - amountPaid`).

### Creditor Payment Sync Workflow
1. **Creditors Tracker Tab (`src/pages/AdminDashboard.jsx`):**
   - Dynamically filters orders where `paymentType === 'Credit'` and `balanceRemaining > 0`.
   - Displays `Total Order`, `Amount Paid`, `Balance Remaining`, and `Credit Age`.
2. **Recording Installments / Full Payments:**
   - **Partial Payment:** Uses `recordCreditorPayment(orderId, paymentAmount)` in `src/services/sales.js` to run an atomic transaction updating `amountPaid` and `balanceRemaining`.
   - **Full Payment Completion:** When `balanceRemaining` reaches `0`:
     - `paymentStatus` is updated to `'Paid'`.
     - `status` is updated to `'completed'`.
     - Order automatically moves into **Business Analysis** as a completed sale.
     - Order automatically archives from the active Creditors list.

---

## 5. Summary of Modified Files

1. `src/services/sales.js`
   - Added `amountPaid` and `balanceRemaining` calculation in `executeTransaction()`.
   - Added atomic stock restoration in `updateOrderStatus()`.
   - Added `recordCreditorPayment()` transaction function.
   - Updated `updateOrderPayment()` to set `status = 'completed'` and `balanceRemaining = 0` when marked `'Paid'`.

2. `src/pages/AdminDashboard.jsx`
   - Added `activeCreditorOrders` state selector and badge count.
   - Added `handleRecordPartialPayment()` handler and partial payment input per creditor row.
   - Updated Creditors Tracker table with columns for `Total Order`, `Amount Paid`, and `Balance Remaining`.
   - Updated sidebar branding to **Gear Link**.

3. `src/components/admin/ManualSaleModal.jsx`
   - Explicitly sets `status: 'pending'` for Credit/Unpaid orders and `status: 'completed'` for Paid orders.
   - Calculates initial `amountPaid` and `balanceRemaining`.

4. `src/pages/Checkout.jsx`
   - Explicitly sets `status: 'pending'`, `amountPaid: 0`, and `balanceRemaining: grandTotal` for storefront orders.

5. `index.html`, `src/services/config.js`, `src/components/Footer.jsx`
   - Rebranded system name to **Gear Link Spares and Accessories**.
