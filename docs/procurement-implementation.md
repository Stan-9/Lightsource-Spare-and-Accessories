# Procurement Tracking System — Implementation & Architecture Guide

**System:** Lightsource / Gear Link Spares Admin Panel  
**Version:** 1.0 (Phases 0 - 3 Completed)  
**Date:** 2026-09-29  

---

## 1. Overview & Business Lifecycle

The Procurement Tracking feature tracks multi-supplier orders, cargo shipping carriers, delivery shortages, unexpected item arrivals, and weighted average landed costs (supplier price + allocated freight fees).

### Complete Data Lifecycle
```
ORDER                SHIP                  ARRIVE                            PRICE                SELL
Purchase Order  -->  Cargo Shipment   -->  Receipt (checked vs invoice)  -->  "Needs pricing" --> Sellable
lines, payments      carrier, ETA,         matched / short / unexpected       queue               storefront
invoice ref          cargo fee             posts stock + landed cost                              + in-shop
```

---

## 2. Directory Structure & File Map

```
docs/
├── procurement-audit.md                  # Phase 0 Audit report & codebase touchpoints
└── procurement-implementation.md         # This implementation guide

firestore.rules                            # Security rules for suppliers, carriers, POs, shipments, receipts

src/
├── services/
│   └── procurement/
│       ├── access.js                     # Access control helper (canAccessProcurement)
│       ├── procurementUtils.js           # Pure derived functions, line status precedence, freight allocation, weighted average cost
│       ├── procurementUtils.test.js      # Vitest unit test suite (26 passing tests)
│       └── procurementService.js         # Firestore CRUD operations & atomic postReceipt transaction
│
├── hooks/
│   └── useProcurement.js                 # Real-time subscription hook for all procurement collections
│
├── components/admin/procurement/
│   ├── ProcurementOverview.jsx           # Dashboard cards (In Transit, Awaiting Cargo, Shortages, Overdue)
│   ├── PurchaseOrdersView.jsx            # PO List & Fast Inline Draft PO Entry Table
│   ├── ShipmentsView.jsx                 # Cargo Shipments List, Create Shipment & Update ETA Modal
│   ├── ReceivingView.jsx                 # Expected vs Actual Receiving check, Good/Damaged inputs, Landed Cost preview & Post Receipt
│   ├── SuppliersCarriersView.jsx         # Supplier & Carrier Directory
│   └── NeedsPricingView.jsx              # Unpriced received items queue & margin preview
│
└── pages/admin-tabs/
    └── ProcurementTab.jsx                # Top-level Procurement workspace container
```

---

## 3. Data Schemas & Firestore Collections

All procurement data uses isolated collections without breaking existing collections (`products`, `orders`, `settings`).

### Collections & Schema Specifications

1. **`suppliers`**
   - `name`: string
   - `phone`: string
   - `email`: string
   - `location`: string
   - `archived`: boolean

2. **`carriers`**
   - `name`: string
   - `phone`: string
   - `archived`: boolean

3. **`purchaseOrders`**
   - `poNumber`: string (e.g. `PO-2026-001`)
   - `supplierId`: string
   - `status`: `'draft'` | `'placed'` | `'cancelled'`
   - `orderDate`: string (`YYYY-MM-DD`)
   - `supplierInvoiceRef`: string
   - `currency`: `'KES'`
   - `fxRateToKES`: number
   - `totalCost`: number
   - `payments`: `Array<{ type: 'payment' | 'refund', amount: number, date: string, method: string, reference: string, by: string }>`

4. **`purchaseLines`**
   - `poId`: string
   - `supplierId`: string
   - `productId`: string | null
   - `pendingProduct`: `{ name: string }` | null
   - `qtyOrdered`: number
   - `qtyCancelled`: number
   - `qtyReceived`: number
   - `unitCost`: number
   - `unitCostKES`: number
   - `shipmentId`: string | null

5. **`shipments`**
   - `carrierId`: string
   - `reference`: string (waybill number)
   - `etaOriginal`: string (`YYYY-MM-DD`)
   - `etaCurrent`: string (`YYYY-MM-DD`)
   - `etaHistory`: `Array<{ from: string, to: string, reason: string, at: string, by: string }>`
   - `cargoCostKES`: number
   - `status`: `'in_transit'` | `'received'` | `'cancelled'`

6. **`receipts`** & **`receiptLines`**
   - `shipmentId`: string | null
   - `cargoCostKES`: number
   - `freightBasis`: `'value'` | `'quantity'`
   - `status`: `'posted'`
   - Lines contain `qtyGood`, `qtyDamaged`, `unexpected`, `unitCostKES`, `freightAllocKES`, `landedUnitCostKES`, `stockBefore`, `costBefore`, `costAfter`.

7. **`stockMovements`**
   - `id`: `{receiptId}_{lineId}` (deterministic idempotency safeguard)
   - `productId`: string
   - `changeQuantity`: number
   - `stockBefore`: number
   - `stockAfter`: number
   - `type`: `'purchase_receipt'`

---

## 4. Key Pure Functions & Business Rules

Located in `src/services/procurement/procurementUtils.js`:

1. **`isProductSellable(product)`**
   - Rule: Returns `true` only if `price > 0 && isVisible !== false`.
   - Used across [StoreFront.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/StoreFront.jsx) and [Catalog.jsx](file:///home/stanley/Desktop/Projects/Lightsource%20/Lightsource-Spare-and-Accessories/src/pages/Catalog.jsx) to ensure unpriced received items are hidden until priced in the **Needs Pricing** queue.

2. **`deriveLineStatus(line, shipment)`**
   - Strict Precedence:
     1. `cancelled`: `qtyCancelled >= qtyOrdered`
     2. `received`: `outstanding === 0`
     3. `in_transit`: `outstanding > 0` and assigned to shipment in transit
     4. `short`: `outstanding > 0` and shipment received or direct partial receipt
     5. `awaiting_dispatch`: `outstanding > 0` (unassigned)

3. **`calculateFreightAllocation(lines, cargoCostKES, basis)`**
   - Allocates freight proportionally by value (`qtyGood * unitCostKES`) or quantity (`qtyGood`).
   - Rounds line allocations to 2 decimal places and places any rounding remainder onto the largest line so allocations sum **exactly** to `cargoCostKES`.

4. **`computeWeightedAverageCost(onHandStock, costBefore, qtyReceived, landedUnitCostKES)`**
   - Computes weighted average landed cost:
     `newCost = (max(onHand, 0) * costBefore + qtyGood * landed) / (max(onHand, 0) + qtyGood)`

---

## 5. Verification & Testing Commands

To run unit tests:
```bash
npm test
```

To build production bundle:
```bash
npm run build
```
