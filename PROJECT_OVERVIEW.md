# Lightsource Project Overview

## 1️⃣ How product pages are structured

| Area | Observation | Example |
|------|-------------|---------|
| **Pages folder** (`src/pages`) | Only static route components are present: `StoreFront.jsx`, `Checkout.jsx`, `Business.jsx`, `AdminDashboard.jsx`, etc. No `product/[id]`‑style file. | – |
| **Routing (App.jsx)** | The router uses **static paths** (`/`, `/checkout`, `/business`, `/admin/...`). There is no `<Route path="/product/:id" …>` entry. | All routes are defined explicitly in `App.jsx`. |
| **Data source** | The app pulls product data from **Firebase** (see `src/firebase/` folder and usage of `onAuthStateChanged`, `auth`, etc.). The data is fetched **client‑side** when the page loads (e.g., inside component `useEffect` hooks). | No pre‑generated HTML files for each product. |
| **Conclusion** | **Product pages are dynamic client‑rendered pages** that retrieve their content from a Firebase database at runtime. They are **not static files** (`/products/brake-pads`) nor server‑side generated (`/product/[id]`). |

## 2️⃣ Framework / build details

| Item | Value |
|------|-------|
| **Framework** | React (v19) |
| **Build tool** | Vite (v8) – `"vite build"` is used for production. |
| **Rendering mode** | **Pure client‑side rendering** – the build creates a single‑page bundle (`dist/assets/index‑*.js`) with no server‑side rendering (SSR) or static‑site generation (SSG) step. |
| **SSR/SSG** | Not configured. All routing and data fetching happen in the browser after the initial HTML shell (`dist/index.html`). |
| **Deploy target** | Cloudflare Pages (via `wrangler pages deploy`). |

## 3️⃣ SEO basics – robots.txt & meta tags

### `robots.txt`
*The repository does **not** contain a `robots.txt` file.* Typical location would be the project root or the `public/` folder, but no such file was found.

### Meta tags on the homepage
From `dist/index.html` (lines 4‑8):

```html
<meta charset="UTF-8" />
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>LightSource Motors | Spare Parts</title>
<!-- Google Fonts: Poppins -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
      rel="stylesheet" />
```

**Observations**
- No `<meta name="description">` tag is present.
- No Open Graph (`og:`) or Twitter Card meta tags are present.
- The page only contains the essential charset, viewport and title tags.

### Recommendation
Add a **`public/robots.txt**` (e.g., `User-agent: *\nAllow: /`) and enrich the `<head>` of `src/index.html` (or the Vite HTML template) with at least:

```html
<meta name="description" content="High‑quality spare parts for LightSource motors – brake pads, oil filters, accessories and more.">
<meta property="og:title" content="LightSource Motors | Spare Parts">
<meta property="og:description" content="Shop reliable motor parts online. Fast shipping, expert support.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://<your‑domain>.pages.dev/">
<meta property="og:image" content="/path/to/hero‑image.jpg">
<meta name="twitter:card" content="summary_large_image">
```

These tags will improve SEO, social‑share previews, and crawlability.

---

### TL;DR
- **Product pages** = dynamic client‑side pages pulling data from Firebase.
- **Framework** = React + Vite, pure client‑side SPA (no SSR/SSG).
- **SEO** = currently missing `robots.txt` and `<meta name="description">`; adding them (and OG/Twitter tags) is a quick win.

Feel free to ask for any of the suggested additions (robots.txt, meta tags, dynamic product component, etc.).
