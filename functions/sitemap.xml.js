export async function onRequest(context) {
  try {
    // Fetch products from Firestore REST API
    const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/lightsource-894e9/databases/(default)/documents/products';
    const response = await fetch(firestoreUrl);
    
    if (!response.ok) {
      throw new Error(`Firestore fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the Firestore REST response
    const products = (data.documents || []).map(doc => {
      // doc.name format: 'projects/lightsource-894e9/databases/(default)/documents/products/DOCUMENT_ID'
      const id = doc.name.split('/').pop();
      const category = doc.fields && doc.fields.category && doc.fields.category.stringValue ? doc.fields.category.stringValue : null;
      return { id, category };
    });

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

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { 
      status: 500,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}
