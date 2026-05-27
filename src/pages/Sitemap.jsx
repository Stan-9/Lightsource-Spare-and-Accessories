import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/shared/Header';
import { Map, Link2, Settings, Compass, HelpCircle } from 'lucide-react';
import { updateSEO } from '../services/seo';

const Sitemap = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.name,
          category: doc.category
        }));
        setProducts(productsList);
      } catch (err) {
        console.error("Error fetching sitemap products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // SEO Updates
  useEffect(() => {
    updateSEO({
      title: 'HTML Sitemap & Index Directory',
      description: 'Comprehensive crawl directory map for LightSource Motors spare parts catalog, technical guides, and manufacturer brand lists.',
      canonicalUrl: `${window.location.origin}/sitemap`,
      schemaData: {
        "@context": "https://schema.org",
        "@type": "SiteNavigationElement",
        "name": "LightSource HTML Sitemap"
      }
    });
  }, []);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = ['GIVI', 'Yamaha', 'Honda', 'TVS', 'Bajaj', 'Suzuki'];

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian selection:bg-accentOrange/30">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-accentOrange/10 rounded-sm border border-accentOrange/20 flex items-center justify-center">
            <Map className="w-5 h-5 text-accentOrange" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-technical uppercase text-white tracking-tight">Index Sitemap</h1>
            <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.25em] font-technical">Crawl Registry Map for Search Engines</p>
          </div>
        </div>

        <p className="text-gray-400 text-xs uppercase tracking-wider leading-relaxed mb-12 max-w-2xl border-l-2 border-machineGray pl-4">
          This registry details the complete path index for the LightSource Motors domain architecture. All URLs are certified clean, canonical, and crawl-ready.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Main Sections */}
          <div>
            <h3 className="text-sm font-black font-technical uppercase tracking-[0.2em] text-accentOrange mb-6 border-b border-machineGray/30 pb-2">
              Primary Navigations
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="/" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Home (MotoPart Hub)
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Catalog (All Products Listings)
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Featured Brands Index
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Resources &amp; Guides Hub
                </Link>
              </li>
              <li>
                <Link to="/business" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Trade &amp; Wholesale Support
                </Link>
              </li>
            </ul>

            <h3 className="text-sm font-black font-technical uppercase tracking-[0.2em] text-accentOrange mt-12 mb-6 border-b border-machineGray/30 pb-2">
              Guides &amp; Resources
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="/resources/installation-guides" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Installation Guides
                </Link>
              </li>
              <li>
                <Link to="/resources/maintenance-tips" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Basic Maintenance Tips
                </Link>
              </li>
              <li>
                <Link to="/resources/customer-showcase" className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-gray-700" /> Customer Build Showcase
                </Link>
              </li>
            </ul>

            <h3 className="text-sm font-black font-technical uppercase tracking-[0.2em] text-accentOrange mt-12 mb-6 border-b border-machineGray/30 pb-2">
              Featured Brands
            </h3>
            <ul className="flex flex-col gap-4">
              {brands.map(b => (
                <li key={b}>
                  <Link to={`/brand/${b.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-gray-700" /> Brand Parts: {b}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Catalog Subcategories & Dynamic Products */}
          <div>
            <h3 className="text-sm font-black font-technical uppercase tracking-[0.2em] text-accentOrange mb-6 border-b border-machineGray/30 pb-2">
              Category Channels
            </h3>
            <ul className="flex flex-col gap-4 mb-12">
              {categories.map(c => (
                <li key={c}>
                  <Link to={`/catalog/${c.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-gray-700" /> category: {c}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-black font-technical uppercase tracking-[0.2em] text-accentOrange mb-6 border-b border-machineGray/30 pb-2">
              Active Hardware Nodes ({products.length})
            </h3>
            {loading ? (
              <span className="text-[10px] font-black uppercase text-gray-600 font-technical animate-pulse">Scanning registry...</span>
            ) : products.length > 0 ? (
              <ul className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                {products.map(p => (
                  <li key={p.id}>
                    <Link to={`/product/${p.id}`} className="text-xs uppercase tracking-wider text-white hover:text-accentOrange flex items-start gap-2 group">
                      <Link2 className="w-3.5 h-3.5 text-gray-700 mt-0.5 shrink-0" />
                      <span className="truncate group-hover:text-accentOrange">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[10px] font-black uppercase text-gray-600 font-technical">No items found in active registry.</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sitemap;
