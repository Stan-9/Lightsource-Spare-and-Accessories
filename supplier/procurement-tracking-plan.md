# Procurement Tracking — Implementation Plan

**System:** Lightsource Spares admin panel (React · Vite · Firebase / Firestore)
**Owner:** Stan
**Audience:** the build agent
**Version:** 1.0

"Procurement" in this document means: Suppliers + Purchase Orders + Cargo Shipments + Receiving.

---

## 0. How to work with this document

1. Read the whole plan before writing any code.
2. **Phase 0 (audit) comes first and is read-only.** This plan was written without access to the codebase. Every reference to existing collections, fields and behaviour is an *assumption to verify*. Where the audit contradicts the plan, stop, report, and propose an amendment. Do not improvise around a mismatch.
3. **Everything is additive.** Existing behaviour (storefront, in-shop sales, orders, the creditor system, stock movements, the analysis page) must not change, except for the changes explicitly listed in §7.
4. **Stop at every checkpoint in §9.** Report what was built, what was tested, and anything surprising, then wait for the owner.
5. **Mirror existing conventions**: folder layout, UI components, money/date helpers, naming, ID generation, error handling. Reuse existing code instead of writing parallel versions.
6. Where §12 lists an open decision, use the stated default unless the owner has answered otherwise, and keep the decision isolated so it can be changed in one place.

---

## 1. Problem and goals

**Situation (stated by the owner)**

- Restocks from several suppliers about every 2 months, usually one large order covering many products from different suppliers at once, shipped through cargo carriers.
- Pays each supplier **in full before the goods start shipping**.
- On arrival, checks the goods against the supplier's invoice, then does stock-taking and enters everything into the system by hand. Only then are products sellable.
- Works out selling prices **after** placing the order, not at order time.
- The real failure so far: **goods arrived that were not expected, and goods that were expected did not arrive.** There is no reliable record of what was ordered from whom, through which carrier, due when, and paid how much.
- For now the manager and the cashier are treated as the same access level.

**Goals**

| # | Goal |
|---|------|
| G1 | Record what was ordered, from which supplier, and what was paid. |
| G2 | Track shipments per carrier: ETA, delays with reasons, and the money value of goods still on the way. |
| G3 | Reconcile on arrival, expected vs actual, and surface unexpected and missing items along with the cash tied up in missing goods. |
| G4 | Feed received goods into stock and cost without re-typing, using true landed cost (supplier price + freight). |
| G5 | Zero regression in the existing system. |

---

## 2. Principles (non-negotiable)

1. **One dataset, three views.** Supplier and carrier screens are queries over the same purchase lines. Never store the same fact twice.
2. **Stock changes only when goods are physically received** (a posted receipt), never on order, payment or shipment creation. The existing system has previously had a bug where stock movements were tied to the wrong event. Do not recreate it.
3. **One write path to stock.** Procurement code never edits stock fields directly. It calls the existing stock-movement writer.
4. **Store facts, derive the rest.** Line status, overdue, totals, balances and supplier/carrier summaries come from pure, unit-tested functions in one module.
5. **Posted receipts are immutable.** Corrections are new documents, never edits.
6. **No hard deletes** of procurement documents that other documents reference. Cancel or archive instead.
7. **Cost data is admin-only.** Nothing procurement writes may be readable by the public storefront.
8. **Additive and flag-guarded.** The feature flag defaults to off.

---

## 3. Concepts and lifecycle

```
ORDER                SHIP                  ARRIVE                            PRICE                SELL
Purchase Order  -->  Shipment         -->  Receipt (checked vs invoice)  -->  "Needs pricing" --> Sellable
lines, payments      carrier, ETA,         matched / short / unexpected       queue               storefront
invoice ref          cargo fee             posts stock + landed cost                              + in-shop
```

**Entities:** Supplier, Carrier, PurchaseOrder, PurchaseLine, Shipment, Receipt, ReceiptLine.

**Relationships**

- A PurchaseLine belongs to exactly one PurchaseOrder, which belongs to exactly one Supplier.
- A PurchaseLine is assigned to at most one Shipment (none until handed to a carrier). A Shipment may hold lines from several POs and suppliers (consolidated freight).
- A Receipt is made against one Shipment, or is a **direct delivery** (no carrier).
- One big order across several suppliers = several POs (one per supplier), whose lines are then grouped into one or more shipments.

**PO status (stored):** `draft` (still adding products) → `placed`, or `cancelled`. "Closed" is derived: placed, and every line received or cancelled.

**Line status (derived, never stored).** Let `outstanding = qtyOrdered − qtyCancelled − qtyReceived`. Apply in this order:

| Order | Status | Rule |
|---|---|---|
| 1 | `cancelled` | `qtyCancelled ≥ qtyOrdered` |
| 2 | `received` | `outstanding = 0` |
| 3 | `in_transit` | `outstanding > 0`, assigned to a shipment that has no posted receipt |
| 4 | `short` | `outstanding > 0` and either its shipment has a posted receipt, or (no shipment and `qtyReceived > 0`). Includes "nothing arrived". |
| 5 | `awaiting_dispatch` | anything else with `outstanding > 0` (no shipment, nothing received) |

**Overdue (derived flag):** status is `in_transit` and today > `shipment.etaCurrent`, or status is `awaiting_dispatch` and today > `PO.expectedDispatchDate`.
**Delayed:** overdue, or `etaCurrent` later than `etaOriginal`.

---

## 4. Data model

New collections only. Verify none of these names already exist (audit A5): `suppliers`, `carriers`, `purchaseOrders`, `purchaseLines`, `shipments`, `receipts`, `receiptLines` (plus a counter document only if the app has no existing numbering pattern).

Conventions: business dates are `'YYYY-MM-DD'` strings (Africa/Nairobi calendar dates). Audit times are Firestore Timestamps. Money is a number with at most 2 decimals; any field ending in `KES` is Kenyan shillings. Every document carries `createdAt, createdBy, updatedAt, updatedBy`. Write it in the project's language (TS types or JS JSDoc).

```ts
Supplier  { name; phone?; email?; location?; notes?; archived: boolean }
Carrier   { name; phone?; notes?; archived: boolean }

PurchaseOrder {
  poNumber: string                    // "PO-2026-014"
  supplierId: string
  status: 'draft' | 'placed' | 'cancelled'
  orderDate: string
  supplierInvoiceRef?: string         // used at the receiving check
  expectedDispatchDate?: string       // optional: when the supplier promised to hand over to cargo
  currency: string                    // default 'KES'
  fxRateToKES: number                 // default 1
  totalCost?: number                  // snapshot at placement, in PO currency
  payments: Array<{ type: 'payment' | 'refund'; amount: number; date: string;
                    method?: string; reference?: string; by: string }>
  notes?: string
  placedAt?; cancelledAt?
}

PurchaseLine {
  poId: string
  supplierId: string                  // denormalised, immutable
  productId?: string                  // existing product ...
  pendingProduct?: { name: string; notes?: string }   // ... or not-yet-catalogued (exactly one of the two)
  qtyOrdered: number                  // integer > 0
  qtyCancelled: number                // default 0
  qtyReceived: number                 // good units posted to stock; default 0; changed ONLY by the posting routine
  unitCost: number                    // PO currency
  shipmentId?: string
  cancelReason?: 'supplier_out_of_stock' | 'refunded' | 'written_off' | 'other'
  cancelNote?: string
}

Shipment {
  carrierId: string
  reference?: string                  // waybill / tracking number
  handedOverDate?: string
  etaOriginal: string                 // never changes
  etaCurrent: string
  etaHistory: Array<{ from: string; to: string; reason: string; at: Timestamp; by: string }>
  cargoCostKES?: number               // may be unknown until collection; required to post a receipt
  status: 'in_transit' | 'received' | 'cancelled'   // 'received' is set by the posting routine
  notes?: string
}

Receipt {
  shipmentId?: string                 // absent = direct delivery (no carrier)
  receivedDate: string
  status: 'draft' | 'posting' | 'posted'
  cargoCostKES: number                // snapshot at posting
  freightBasis: 'value' | 'quantity'
  notes?: string
  postedAt?; postedBy?
}

ReceiptLine {
  receiptId: string
  purchaseLineId?: string             // absent = unexpected item
  productId?: string
  pendingProduct?: { name: string; notes?: string }
  qtyExpected: number                 // outstanding when receiving started (0 for unexpected)
  qtyGood: number
  qtyDamaged: number                  // arrived but unusable; not added to stock
  unexpected: boolean
  unexpectedResolution?: 'unresolved' | 'matched' | 'accepted' | 'returned'
  unitCostKES: number
  freightAllocKES: number
  landedUnitCostKES: number
  stockBefore?; costBefore?; costAfter?   // audit trail, enables later reversal
  posted: boolean
  note?: string
}
```

**Model notes**

- Lines are separate documents because they are queried across POs (by shipment, by status) and updated independently.
- `supplierId` is copied onto lines (immutable, safe). `carrierId` is deliberately **not** copied onto lines. Carrier views go shipments → lines, so there is no sync to break. Volume is a handful of shipments per two months.
- The only stored total is `PO.totalCost`, snapshotted at placement. Everything else is derived.

---

## 5. Business rules

### 5.1 Purchase orders and payments

- A PO starts as `draft` while lines are added. **Place order** requires a supplier, at least one line, integer qty > 0 and unit cost ≥ 0 on every line. Warn (do not block) on a duplicate product within the PO and on an empty invoice reference. Placement snapshots `totalCost` and locks the lines. On a placed PO only `qtyCancelled`, `shipmentId` and `payments` may change.
- Cancelling a PO is allowed only when nothing has been received against it. If money was paid, prompt to record a refund.
- Payment state is derived: `unpaid`, `partial`, `paid`, from net payments (payments − refunds) against `totalCost`. The UI shows "Paid X of Y" and a **Record payment / refund** button. **No balance schedules, reminders or payment-history screens in v1**: the owner normally pays in full before shipping. The array model supports partial payments so no migration is needed later.
- Currency: the v1 UI is KES-only. `currency` and `fxRateToKES` exist (defaults `'KES'`, `1`) so foreign-currency orders can be switched on later without migration. All cost maths converts through the PO's rate (§12-1).
- Numbering: `PO-YYYY-NNN`, using the app's existing counter pattern for order numbers if there is one (audit A6).

### 5.2 Shipments, ETA and delays

- Create a shipment by selecting lines (across POs and suppliers), then carrier, reference (optional), handed-over date, ETA and cargo fee (optional at this point). Selected lines get `shipmentId`. Only lines of `placed` POs with `outstanding > 0` can be assigned.
- A line can be moved between shipments while its shipment has no posted receipt, or when re-shipping a `short` line. A shipment can be cancelled only if it has no posted receipt; its lines become unassigned.
- The carrier's ETA is a promise, not a fact. `etaOriginal` never changes. **Update ETA** requires a reason (presets: customs, carrier backlog, supplier delay, transport/weather, other + free text) and appends to `etaHistory`. This is the "flag as delayed, with reason" feature. Overdue is derived automatically, so nothing depends on the owner remembering to flag it.
- Compare dates as Africa/Nairobi calendar days.

### 5.3 Receiving and reconciliation (the core of the feature)

The recurring problem is reconciliation: unexpected arrivals and non-arrivals. The receiving screen therefore **compares expected against actual**. It is not a data-entry form.

1. Start from a shipment (**Receive**), or as a direct delivery (choose PO(s)). One draft receipt per shipment. Drafts autosave.
2. Expected lines are listed **grouped by PO/supplier, showing the supplier invoice reference**, so the owner can check them against one invoice at a time.
3. Each line has **Good** and **Damaged** quantity inputs, **empty by default**. Never pre-fill: it makes rubber-stamping too easy. Provide a per-line **Received in full** button and a per-group version that asks for confirmation.
4. **Add unexpected item**: pick an existing product or a new one, qty, note. The app first searches all open lines (`outstanding > 0`) for that product across all POs and shipments and offers matches. Picking a match turns it into a normal receipt line (covers "came in the wrong shipment" and "shipment never recorded"). No match: the item is recorded as **unexpected, quarantined (no stock)**, `unexpectedResolution = 'unresolved'`, and appears in the Unexpected queue.
5. Lines for not-yet-catalogued products must be linked to an existing product or turned into a new one (existing creation logic, §5.6) before posting.
6. Enter the cargo cost (required to post; 0 is allowed) and the freight basis (`value` default, or `quantity`).
7. **Review screen** before posting: lines matched, lines short (qty and money value at cost), unexpected items, freight allocation, new average cost per product versus current, products that will need pricing.
8. **Post.** Not reversible from the UI.

**After posting**

- Lines with `outstanding > 0` become `short`. They show on the dashboard with days since receipt and the money value (cash already paid for goods not delivered). Resolve by **re-assigning to a shipment** (chased or re-sent) or **cancelling the remainder** with a reason (`refunded`, optionally recording the refund on the PO; `written_off`; `supplier_out_of_stock`).
- Damaged units are not added to stock and stay outstanding, so they surface as `short` until replaced, refunded or written off.
- Unexpected items are resolved from the queue: **Match to an open line**, **Accept** (owner enters unit cost; posts to stock like any line, no freight), or **Return** (recorded, no stock).
- Late items for a shipment already received: open a new receipt on that shipment. Freight is allocated once, on the first posted receipt. Later receipts carry 0 freight (known limitation).

### 5.4 Posting routine (one function, the only writer of received stock)

- Status machine: `draft → posting → posted`. A `posting` receipt cannot be edited but can be resumed.
- **Step 1, whole receipt, pure:** compute freight allocation and landed unit costs; persist them on the ReceiptLines.
- **Step 2, in chunks of at most 100 lines per commit** (confirm Firestore's current per-commit write limit; historically 500): inside a transaction, for each line not yet `posted`: re-read the product (stock, cost); write the stock movement with a **deterministic ID** (`{receiptId}_{receiptLineId}`) through the existing writer; increment stock; set the new average cost; increment `purchaseLine.qtyReceived`; record `stockBefore/costBefore/costAfter`; mark the line `posted`.
- **Step 3:** mark the receipt `posted` and the shipment `received`.
- Safe to retry: re-running skips lines already `posted`.
- Use the write pattern the app already uses for stock and orders (client transaction vs callable function). Do not introduce Cloud Functions only for this (it may require a billing-plan change).

### 5.5 Landed cost and average cost

- `unitCostKES = unitCost × PO.fxRateToKES`
- `freightAlloc(line) = cargoCostKES × weight(line) / Σ weight(all posted lines in the receipt)`, where `weight = qtyGood × unitCostKES` (basis `value`) or `qtyGood` (basis `quantity`). If the sum is 0, use quantity.
- Round each allocation to 2 decimals and put the rounding remainder on the largest line, so **allocations sum exactly to the cargo cost**.
- `landedUnitCostKES = unitCostKES + freightAllocKES / qtyGood`
- New product cost (weighted average): `newCost = (max(onHand,0) × costBefore + qtyGood × landed) / (max(onHand,0) + qtyGood)`. If `costBefore` is empty or `onHand ≤ 0`, `newCost = landed`. Example: 10 on hand at 100, receive 40 at 130 landed → 124.
- Write `newCost` into the product's **existing** buying-price field so the analysis page keeps working unchanged. Put the method behind one function, `computeNewCost()`, so the owner can switch to last-purchase cost (§12-2).
- Historical profit must not change (risk R2).

### 5.6 Pricing gate

- The selling price is **not** entered at order time and **not** required to post stock.
- Existing products that already have a valid selling price stay sellable throughout. The review screen shows margin at the new cost, and the owner may update the price.
- **New products** (created at receiving) and any product with no valid selling price: stock is counted, but the product is **not sellable in any channel** until priced. They appear in the **Needs pricing** queue with landed cost and a margin preview. The owner types the price; there is no auto-pricing. Pricing writes every price field the product has (audit A1: retail, any wholesale).
- One shared pure helper, `isProductSellable(product)`, is the single definition, used by storefront, in-shop sales, search and sitemap. Implementation preference order is in R1.
- Never change the visibility flag of an existing product that already has a valid selling price.
- Creating a new product at receiving: reuse the existing product-creation logic and validation (slug, category, SEO side effects). Create it with stock 0 and let the receipt's stock movement add the quantity, so movement history stays coherent.

### 5.7 "Worth of goods arriving"

Default = supplier cost in KES, excluding freight: `Σ outstanding × unitCostKES`. Show it for `in_transit` lines (per shipment, per carrier, total) and separately for `awaiting_dispatch`. "Paid, not delivered" uses the same maths over `short` lines. Optionally show expected retail value (secondary, clearly labelled) for products that already have a selling price.

### 5.8 Supplier and carrier views (derived, not stored)

- **Supplier:** contact; POs with status; total paid (net, KES); lines by status; badges: *Draft order in progress*, *Unpaid: KES X*, *Awaiting delivery: N lines / KES X*, *Paid, not delivered: KES X*.
- **Carrier:** active shipments with ETA and days left or overdue; the lines in each (product, qty, supplier, value); cargo fees paid (per shipment and lifetime); delay history from `etaHistory`.
- Carrier query path: shipments where `carrierId == X` → lines where `shipmentId in [...]` (chunks of 30; confirm current `in` limit).

---

## 6. Screens and UX

**Procurement** (nav item, behind the feature flag), with these screens:

| Screen | Contents |
|---|---|
| Overview | Cards: value in transit, awaiting dispatch, paid-not-delivered, overdue count. Lists: arriving in the next 7 days (by ETA), overdue, short lines, unresolved unexpected items, needs pricing, draft POs. |
| Orders | List (filters: status, supplier, unpaid, has undelivered). PO detail: header (supplier, invoice ref, dates), lines table, payments ("Paid X of Y"), line status badges, Place / Cancel, assign lines to shipment. |
| Shipments | List; create from selected lines; detail with lines grouped by PO/supplier, ETA and **Update ETA (reason)**, **Receive**. |
| Receiving | As §5.3. |
| Suppliers | List and detail (§5.8). |
| Carriers | List and detail (§5.8). |
| Queues | Needs pricing · Short lines · Unexpected items. |

**UX requirements**

1. **PO entry must be fast.** Keyboard-first inline table: product search → qty → unit cost → Tab/Enter to the next row. Running total and line count always visible. Duplicates flagged. If entering an order is slow, the owner will skip it and every downstream check fails (R14). CSV/paste import is Phase 4, but the table must not be one modal per line.
2. **Receiving must work at phone/tablet width** (it happens next to the parcels): large tap targets, sticky totals.
3. Quantities on receiving are **empty by default**.
4. Money is always KES through the app's existing formatter. Label supplier cost and landed cost distinctly.
5. Status badges come only from the derived-status functions. Never a manually set status.
6. Confirm irreversible actions (Post, Cancel remainder, Return).
7. Loading, empty and error states match the rest of the app.

---

## 7. Integration with the existing system

### 7.1 Phase 0 audit checklist (read-only)

**A. Data and schema**

- **A1 Products:** fields for buying price, selling price(s) including any wholesale price, stock, active/visible flag, category, slug, variants/SKUs. Is stock a stored field or derived from movements? Are there currently visible products with a missing or zero selling price?
- **A2 Stock movements:** collection, schema, type enum, the single writer function, and **every consumer** (history views, reports, labels, filters).
- **A3 Sales/orders:** how sale line items store price and cost; **do they snapshot cost at the time of sale?** Where the analysis page gets cost, and its exact profit formula and date handling.
- **A4 Creditor system:** what it tracks (customer credit vs supplier payables), its collections, components and enums.
- **A5 Existing supplier/cargo/purchase-related fields or collections**, to avoid name collisions.
- **A6 Numbering:** how order numbers are generated.

**B. Read paths**

- **B1** Every place products are read for display or sale: storefront lists, detail, search, category pages, cart/checkout, in-shop sale product picker, low-stock alerts, exports, the sitemap generator (if there is one), any search index.
- **B2** Existing visibility/active flags and exactly how those queries are written (which filter operators).

**C. Access and security**

- **C1** Firestore rules: structure, helper functions, public-read paths (especially products).
- **C2** How roles are decided (client guard and rules); manager vs cashier.
- **C3** Where cost fields live and who can read them.

**D. Platform and conventions**

- **D1** Language (TS/JS), router, data-fetching/state pattern, UI library, form patterns, money/date helpers, error/toast patterns.
- **D2** Write pattern for stock and orders (client transaction vs callable function) and billing-plan implications.
- **D3** Emulator and test setup, `firestore.indexes.json`, environments (staging vs production), deployment process, backup options.
- **D4** Existing feature-flag mechanism (or propose the simplest one).

**E. Deliverable:** `docs/procurement-audit.md`. For each item: finding (with file paths), risk to this plan, proposed adjustment. **Then stop** for owner review.

### 7.2 Touchpoints with the existing system

| Existing area | What Procurement does | Compatibility requirement |
|---|---|---|
| Products | Reads stock/cost/price. Writes stock and buying price **only** via the posting routine. Creates new products at receiving. | Reuse existing create/edit logic. Never rename or retype existing fields. New fields only if unavoidable and only with backfill (R1). |
| Stock movements | Adds one type, `purchase_receipt`, via the existing writer. | Register the type wherever types are enumerated (labels, filters, reports). Confirm unknown types cannot crash existing views. |
| Orders and sales (status fields such as `fulfillmentStatus` and `paymentStatus`) | No reads or writes, except the cost-at-sale snapshot if audit A3 shows it is missing (R2). | Do not reuse or extend those enums for procurement. Procurement has its own status names. |
| Creditor system | None. | Confirm what "creditor" means in current code. No shared collections, components or enums with procurement payments. |
| Analysis / profit page | Cost basis moves as average landed cost changes. | Past profit must not change (R2). Compare totals before and after. |
| Storefront, search | Unpriced new products must stay hidden. | Gate per §5.6, verified on every read path from B1. |
| Sitemap / SEO (if any) | Must exclude unpriced products. | Same `isProductSellable` rule as the storefront. |
| In-shop sales | Unpriced products must not be sellable. | Block or warn in the product picker. |
| Manual stock entry (today's stock-taking path) | Remains for adjustments and opening stock. | Keep it. Label it "Manual adjustment". Add a note that purchased goods should be received through Procurement to avoid double counting. |
| Admin nav and routing | New Procurement section. | Behind the flag; reuse the existing route guard. |
| Firestore rules and indexes | New collections and composite indexes. | Deny by default; do not loosen existing rules; rules tests; indexes in `firestore.indexes.json`. |

### 7.3 Risk register

| ID | Risk | Safeguard | Verify |
|---|---|---|---|
| R1 | **Missing-field queries hide existing products.** Firestore `==` and `!=` filters do not match documents where the field is absent. A new `isSellable == true` or `!= false` filter would make every existing product vanish. | Preference order: (a) reuse an existing active/visible flag, set inactive until priced; (b) derive sellability from a valid selling price; (c) only if neither works, add a new field and **backfill every existing product first** (backup, emulator, staging, then production with owner approval), and only then deploy queries that depend on it. | Storefront product count and sitemap URL count identical before and after. |
| R2 | **Historical profit gets rewritten.** If the analysis reads the product's *current* buying price at read time, changing the average cost changes past profit. | Sale lines snapshot cost at sale time (`unitCostAtSale`, or the existing equivalent). Analysis prefers the snapshot and falls back to product cost only for legacy sales. Do **not** silently backfill legacy sales. | Analysis totals for a fixed past date range identical before and after a receipt is posted. |
| R3 | **Double-counted stock** (double-click or retry on Post; the same goods also entered through manual stock entry). | Deterministic movement IDs, status checks inside the transaction, disabled button after click, receipt status machine, UI note on manual entry, cutover rule (§12-6). | Post twice: stock and movement count unchanged. |
| R4 | **New movement type breaks existing views.** | Audit A2 lists every consumer; register the type in all of them. | Open movement history and every report with a `purchase_receipt` movement present. |
| R5 | **Stock tied to the wrong event.** | Stock changes only in the posting routine. No triggers or listeners on PO, payment or shipment writes. | Code search: only the posting routine calls the stock writer for procurement. |
| R6 | **Cost data exposure.** | Procurement collections are admin-only. Landed-cost detail lives only in `receiptLines`. Check whether public-read product documents already expose the buying price; report it to the owner, do not change it silently. | Rules tests: unauthenticated and unauthorised reads and writes denied. |
| R7 | **Name/enum collisions** with `paymentStatus`, creditor concepts, existing components. | Distinct names; namespaced constants and components. | Grep for reuse during review. |
| R8 | **Unpriced products leak** through sitemap, search or in-shop sales. | Single shared `isProductSellable`; test each surface. | Manual check of each surface listed in B1. |
| R9 | **Timezone drift** on ETAs and overdue. | Date-only strings; compare in Africa/Nairobi. | Unit tests around midnight. |
| R10 | **Sales during posting.** | Transaction reads stock at commit; use increments; average cost uses on-hand read inside the transaction. | Emulator test with a concurrent sale. |
| R11 | **Rounding drift** in freight allocation. | 2-decimal allocation, remainder to largest line. | Unit test: 3 lines, fee 1000, allocations sum to exactly 1000. |
| R12 | **Write limits** on large receipts. | Chunks of ≤100 lines, deterministic IDs, resumable `posting` status. | Emulator test with 150+ lines and a simulated mid-post failure. |
| R13 | **Missing composite indexes** fail only in a real project (the emulator generally does not enforce them). | List every multi-field query and its index in `firestore.indexes.json`. | Exercise every screen in a staging project. |
| R14 | **Incomplete PO data** produces false "unexpected" items and destroys trust. | Cutover rule (§12-6), fast entry UX (§6), dashboard warning for shipments with no lines. | Dry run (§10.5). |

---

## 8. Security and access

- **Rules:** deny by default on every new collection. Read and write only if `canProcure()`. No public reads. Deny deletes except for draft POs and their lines. `posted` receipts and their lines are immutable; receipt status may only move `draft → posting → posted`; `purchaseLines.qtyReceived` may not decrease. Ship a rules test suite (emulator).
- **Access:** one helper, `canAccessProcurement(user)`, used by the route guard, the nav and mirrored in rules as `canProcure()`. Default: same as existing admin-panel access (the owner treats manager and cashier as one level for now). Restricting to manager later is a one-line change. Do not scatter role checks through components.
- **Cost exposure:** see R6.
- **Audit trail:** `createdBy/updatedBy/postedBy` on every write.

---

## 9. Phases and checkpoints

**Phase 0: Audit (read-only)**
Deliverable: `docs/procurement-audit.md` (§7.1). **STOP.** The owner approves findings and any plan amendments.

**Phase 1: Groundwork (no visible change)**

- Feature flag (default off), hidden nav/route stub, `canAccessProcurement`.
- Rules and indexes for the new collections, with rules tests.
- `procurement/` module: types, pure derive functions with unit tests, shared `isProductSellable`.
- Register `purchase_receipt` in every consumer found in A2.
- If A3 found no cost snapshot on sales: add `unitCostAtSale` to new sales; analysis prefers it; legacy fallback unchanged. Report before/after totals.
- If R1 requires it: visibility groundwork (reuse the existing flag, or backfill).

Acceptance: regression checklist (§10.4) passes; analysis totals for a fixed historical range identical before and after; storefront product count identical; new unit and rules tests pass. **STOP.**

**Phase 2: Record and track (writes only to new collections)**

- Suppliers and carriers (archive, not delete).
- POs: draft → placed, lines, payments, invoice ref.
- Shipments with ETA and delay reasons.
- Overview dashboard; supplier and carrier pages.

Acceptance: the owner's most recent real multi-supplier order entered end to end; supplier and carrier totals match a hand calculation; derived statuses correct; verified that nothing in this phase touches products, stock movements or orders. **STOP.** The owner uses it on real orders.

**Phase 3: Receive and reconcile (first phase that writes to existing data)**

- Receiving screen, draft receipts, unexpected-item matching, review screen.
- Posting routine, freight allocation, average cost, stock movements.
- New-product creation at receiving, Needs-pricing queue and the pricing gate.
- Short and unexpected resolution actions.

Acceptance: all scenarios in §10.3; regression checklist with the flag off and on; dry run (§10.5). **STOP.** The flag stays off in production until the owner approves.

**Phase 4: Follow-ups (only after at least one real order has gone through Phase 3)**
Reversal of posted receipts (using stored `stockBefore/costBefore`), CSV/paste line import, invoice attachments, carrier and supplier reliability report (ETA vs actual), landed-cost report, per-line freight override, notifications.

**Rollback:** turn the flag off. Procurement collections are isolated. Posted receipts are the only writes to existing data and every one is traceable by `receiptId` on its stock movements. Until Phase 4 adds reversal, corrections use the existing manual stock adjustment.

---

## 10. Testing

**10.1 Unit tests (pure functions):** line status precedence, overdue and delayed, PO totals and payment state, freight allocation (exact sum), average cost (including zero/negative on-hand and missing `costBefore`), worth of arrivals, `isProductSellable`, date handling around midnight.

**10.2 Emulator tests:** posting idempotency, resume after a simulated mid-post failure, concurrent sale during posting, rules tests (public denied, unauthorised denied, posted receipts immutable).

**10.3 Scenario tests (Phase 3 acceptance)**

1. Everything arrives as ordered: stock +qty, cost updated, movements created, PO derives as closed.
2. Short: 30 of 50 arrive: stock +30, line shows 20 short with money value; resolve by cancelling the remainder as refunded.
3. Unexpected item that matches an open line in another shipment: becomes a normal receipt.
4. Unexpected item with no match: quarantined, no stock, appears in queue; **Accept** with a cost then posts it.
5. New product: created, stock posted, hidden everywhere until priced, then visible; not in the sitemap while unpriced.
6. Post pressed twice or retried: no double stock.
7. Freight of 1000 over 3 lines: allocations sum to exactly 1000.
8. Average cost: 10 on hand at 100, 40 received at 130 landed → 124; on-hand 0 or negative → landed.
9. Historical profit unchanged after posting a receipt.
10. Existing priced product stays sellable throughout; margin preview shown.
11. Damaged units excluded from stock and shown as short.
12. Direct delivery (no carrier) with cargo cost 0.
13. Receipt with 150+ lines posts fully across chunks and resumes after a simulated failure.
14. Unauthenticated and unauthorised users cannot read or write any procurement document; posted receipt cannot be edited or deleted.
15. Flag off: no nav, no routes, existing app unchanged.

**10.4 Regression checklist (run at the end of Phase 1 and Phase 3, flag off and on)**

- Storefront: home, category, product detail, search, cart, checkout. Product count identical.
- Admin: orders (create/update and their fulfilment/payment status transitions), creditor screens, product create/edit, stock adjustments, stock-movement history.
- In-shop sale flow.
- Analysis/profit page: totals for a fixed historical range identical.
- Sitemap output (if any): URL count identical.
- Roles: unauthorised users cannot reach Procurement; existing role behaviour unchanged.
- Build, lint, type-check and all existing tests pass.

**10.5 Dry run:** the owner buys about every two months, so real use will find bugs slowly and at the worst moment (a big shipment on the table). Before the flag is turned on in production, replay the owner's last real order end to end in the emulator or a staging project: enter the POs, create shipments, receive with a deliberate shortage and one unexpected item, post, price.

---

## 11. Out of scope for v1

- Foreign-currency UI (unless §12-1 is yes)
- Notifications (push, email, WhatsApp)
- Carrier tracking API integrations
- Payment schedules, balance reminders, supplier statements
- Role separation beyond the single access helper
- Supplier price comparison, reorder suggestions, barcode scanning
- Reversal of posted receipts, invoice attachments, per-line freight override (Phase 4)

---

## 12. Open decisions (use the default until the owner answers)

| # | Decision | Default used | Question for the owner |
|---|---|---|---|
| 1 | Foreign currency | KES-only UI; fields exist | Do you pay any supplier in USD, CNY or AED? If yes, enable the rate input in Phase 2. |
| 2 | Cost method | Weighted average landed cost | Have you had leftover stock at an old cost when a new batch arrived? Would you prefer last-purchase cost? |
| 3 | Freight allocation | By value; switchable to quantity per receipt | Are bulky, low-value items (helmets, tyres) common? By-value under-costs them. |
| 4 | Missing goods | Shows as `short` with value and days outstanding; resolve by re-ship, refund or write-off; no automatic deadline | What actually happens when goods do not arrive: chase, wait, refund? How long does it take? (Add a claim deadline and alert if needed.) |
| 5 | Unexpected goods | Quarantined (no stock) until resolved | What were they: unlogged orders, supplier extras, a wrong parcel? |
| 6 | Cutover | On go-live, enter every order still in transit as a PO. Anything not entered is received the old way. Never both. | Go-live date? |
| 7 | Access | Same as existing admin access | Will manager and cashier become separate people with separate logins? |
| 8 | PO number format | `PO-YYYY-NNN` | OK? |
