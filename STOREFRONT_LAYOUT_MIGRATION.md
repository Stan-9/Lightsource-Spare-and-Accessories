# Storefront Mobile Layout Migration Log

This document provides a concise, developer-centric record of the layout changes made to migrate the storefront product grid from a single-column layout on mobile viewports to a compact, responsive **two-column layout** (similar to premium e-commerce sites like Kilimall and AliExpress).

---

## 1. Summary of Changes

* **Grid Arrangement**: Converted mobile grid container structure from `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` to a default of `grid-cols-2 lg:grid-cols-3`. Gaps are tightened on mobile screens from `gap-4` to `gap-3`.
* **Card Proportions**: Reduced image containers on mobile viewports to `h-36` to maintain a clean square aspect ratio. Reduced outer card container padding to `p-2` on mobile.
* **Badges**: Category and operational status indicators inside image wrappers scale down to `text-[7px]` with tighter paddings (`px-1.5 py-0.5`). Badge containers stack vertically (`flex-col`) on mobile to prevent clipping.
* **Card Content**: Product titles are set to `text-xs` on mobile and clamped to a maximum of 2 lines (`line-clamp-2`). Long product description blocks are hidden on mobile viewports (`hidden sm:block`).
* **Price & Stock Details**: Price (`KES`) and stock items stack vertically on mobile viewports. Secondary descriptor labels (`MSRP / Unit`, `Status`) are hidden on mobile to maximize room.
* **Action Button**: Add button sizes, margins, and text are dynamically adjusted. Displays as a compact **"Acquire +"** button on mobile viewports and falls back to **"Acquire Part +"** on larger viewports.
* **Loading Skeleton**: `SkeletonCard.jsx` loader updated to match the responsive heights, paddings, gaps, and button properties of the active product card.

---

## 2. Modified Files & Code Implementations

### A. Storefront Product Grid & Card Redesign
* **File Path**: `src/pages/StoreFront.jsx`
* **Specific Code Replacements**:

#### 1. Grid Column Setup
```jsx
// BEFORE:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12">

// AFTER:
<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 lg:gap-12">
```

#### 2. Image Container & Overlay Badges
```jsx
// BEFORE:
<div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack overflow-hidden flex items-center justify-center border-b border-machineGray/50">
  {/* image and spacer properties */}
  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-between items-center z-10">
    <div className="bg-machineGray/80 backdrop-blur-md px-3 py-1 rounded-sm text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.2em] font-technical">
      {product.category || 'GENUINE PART'}
    </div>
    <div className={`px-3 py-1 rounded-sm text-[9px] font-black shadow-lg flex items-center gap-2 uppercase tracking-[0.2em] ${...}`}>
      <span className="w-1.5 h-1.5 rounded-full ..." />
      {isOutOfStock ? 'Depleted' : 'Operational'}
    </div>
  </div>
</div>

// AFTER:
<div className="relative h-36 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack overflow-hidden flex items-center justify-center border-b border-machineGray/50">
  {/* image and spacer properties */}
  <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex flex-col sm:flex-row gap-1 sm:gap-2 justify-between items-start sm:items-center z-10">
    <div className="bg-machineGray/80 backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-sm text-[7px] sm:text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.2em] font-technical">
      {product.category || 'GENUINE PART'}
    </div>
    <div className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-sm text-[7px] sm:text-[9px] font-black shadow-lg flex items-center gap-1 sm:gap-2 uppercase tracking-[0.2em] ${...}`}>
      <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ..." />
      {isOutOfStock ? 'Depleted' : 'Operational'}
    </div>
  </div>
</div>
```

#### 3. Card Body, Typography, Price Stack & Button CTA
```jsx
// BEFORE:
<div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1 relative">
  <div className="mb-6">
    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-white group-hover:text-accentOrange transition-colors duration-300 leading-tight font-technical uppercase tracking-tighter">
      {product.name}
    </h3>
    {product.description && (
      <p className="text-gray-500 text-xs mt-4 line-clamp-3 leading-relaxed font-utilitarian uppercase tracking-wide border-l-2 border-machineGray pl-4">
        {product.description}
      </p>
    )}
  </div>

  <div className="mt-auto flex items-end justify-between border-t border-machineGray/30 pt-6">
    <div>
      <span className="text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">MSRP / Unit</span>
      <span className="text-lg sm:text-xl md:text-2xl font-black text-white font-technical">
        <span className="text-accentOrange text-sm mr-1">KES</span>
        {product.price.toLocaleString()}
      </span>
    </div>
    <div className="text-right">
      <span className="text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">Status</span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-brakeRed' : 'text-machineryGreen'}`}>
        {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
      </span>
    </div>
  </div>

  <button className="mt-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] w-full flex justify-center items-center gap-3 transition-all duration-300 font-technical ...">
    {isOutOfStock ? 'ITEM DEPLETED' : maxReached ? 'INVENTORY LIMIT' : (
      <>
        Acquire Part
        <Plus className="w-4 h-4" />
      </>
    )}
  </button>
</div>

// AFTER:
<div className="p-2 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1 relative">
  <div className="mb-2 sm:mb-6">
    <h3 className="text-xs sm:text-base md:text-lg lg:text-xl font-black text-white group-hover:text-accentOrange transition-colors duration-300 leading-tight font-technical uppercase tracking-tighter line-clamp-2">
      {product.name}
    </h3>
    {product.description && (
      <p className="hidden sm:block text-gray-500 text-xs mt-4 line-clamp-3 leading-relaxed font-utilitarian uppercase tracking-wide border-l-2 border-machineGray pl-4">
        {product.description}
      </p>
    )}
  </div>

  <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between border-t border-machineGray/30 pt-3 sm:pt-6 gap-2">
    <div>
      <span className="hidden sm:block text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">MSRP / Unit</span>
      <span className="text-sm sm:text-xl md:text-2xl font-black text-white font-technical">
        <span className="text-accentOrange text-[10px] sm:text-sm mr-0.5 sm:mr-1">KES</span>
        {product.price.toLocaleString()}
      </span>
    </div>
    <div className="text-left sm:text-right">
      <span className="hidden sm:block text-[9px] text-gray-600 uppercase font-black block tracking-[0.3em] mb-2 font-technical">Status</span>
      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${isOutOfStock ? 'text-brakeRed' : 'text-machineryGreen'}`}>
        {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
      </span>
    </div>
  </div>

  <button className="mt-4 py-2.5 sm:py-4 rounded-sm font-black text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] w-full flex justify-center items-center gap-1.5 sm:gap-3 transition-all duration-300 font-technical ...">
    {isOutOfStock ? 'DEPLETED' : maxReached ? 'LIMIT' : (
      <>
        <span className="hidden sm:inline">Acquire Part</span>
        <span className="inline sm:hidden">Acquire</span>
        <Plus className="w-3.5 h-3.5" />
      </>
    )}
  </button>
</div>
```

---

### B. Skeleton Loader Styling Adjustment
* **File Path**: `src/components/shared/SkeletonCard.jsx`
* **Specific Code Replacements**:

```jsx
// BEFORE:
const SkeletonCard = () => {
  return (
    <div className="bg-machineGray/10 rounded-sm overflow-hidden border-2 border-machineGray/50 animate-pulse flex flex-col">
      <div className="h-40 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack w-full border-b border-machineGray/50" />
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col gap-4 flex-1">
        <div className="h-7 bg-machineGray/50 rounded-sm w-3/4" />
        <div className="h-4 bg-machineGray/50 rounded-sm w-1/2" />
        <div className="mt-auto flex justify-between pt-6 border-t border-machineGray/30">
          <div className="h-6 bg-machineGray/50 rounded-sm w-1/3" />
          <div className="h-6 bg-machineGray/50 rounded-sm w-1/4" />
        </div>
        <div className="mt-8 h-14 bg-machineGray/50 rounded-sm w-full" />
      </div>
    </div>
  );
};

// AFTER:
const SkeletonCard = () => {
  return (
    <div className="bg-machineGray/10 rounded-sm overflow-hidden border-2 border-machineGray/50 animate-pulse flex flex-col">
      <div className="h-36 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack w-full border-b border-machineGray/50" />
      <div className="p-2 sm:p-4 md:p-5 lg:p-6 flex flex-col gap-2 sm:gap-4 flex-1">
        <div className="h-5 sm:h-7 bg-machineGray/50 rounded-sm w-3/4" />
        <div className="h-3 sm:h-4 bg-machineGray/50 rounded-sm w-1/2" />
        <div className="mt-auto flex justify-between pt-3 sm:pt-6 border-t border-machineGray/30">
          <div className="h-4 sm:h-6 bg-machineGray/50 rounded-sm w-1/3" />
          <div className="h-4 sm:h-6 bg-machineGray/50 rounded-sm w-1/4" />
        </div>
        <div className="mt-4 sm:mt-8 h-8 sm:h-14 bg-machineGray/50 rounded-sm w-full" />
      </div>
    </div>
  );
};
```
