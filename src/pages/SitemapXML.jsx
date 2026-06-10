import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const SitemapXML = () => {
  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const productsCol = collection(db, 'products');
        const productsSnap = await getDocs(productsCol);
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        const today = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lightsourcespares.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lightsourcespares.com/catalog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://lightsourcespares.com/brands</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://lightsourcespares.com/resources</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://lightsourcespares.com/business</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

        categories.forEach(cat => {
          const slug = cat.toLowerCase().replace(/\s+/g, '-');
          xml += `  <url>
    <loc>https://lightsourcespares.com/catalog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        });

        products.forEach(p => {
          xml += `  <url>
    <loc>https://lightsourcespares.com/product/${p.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
        });

        xml += `</urlset>`;

        // Output raw XML to the document
        document.open();
        document.write(xml);
        document.close();
      } catch (err) {
        console.error("Error generating sitemap:", err);
      }
    };

    generateSitemap();
  }, []);

  return null;
};

export default SitemapXML;
