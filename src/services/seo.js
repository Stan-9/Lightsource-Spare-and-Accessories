/**
 * Dynamic SEO & Structured Data Injection Helper
 */
export const updateSEO = ({ title, description, canonicalUrl, schemaData, ogImage }) => {
  if (typeof window === 'undefined') return;

  // 1. Title
  if (title) {
    document.title = title;
  }

  const setMetaTag = (attrName, attrValue, content) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Meta Tags
  setMetaTag('name', 'description', description);
  
  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', ogImage);
  if (canonicalUrl && canonicalUrl.includes('/product/')) {
    setMetaTag('property', 'og:type', 'product');
  } else {
    setMetaTag('property', 'og:type', 'website');
  }

  // Twitter
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage);

  // 3. Canonical Tag
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalUrl) {
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
  } else if (canonicalLink) {
    canonicalLink.remove();
  }

  // 4. Schema.org Structured Data (JSON-LD)
  let schemaScript = document.getElementById('seo-schema-ld');
  if (schemaData) {
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.setAttribute('id', 'seo-schema-ld');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schemaData, null, 2);
  } else if (schemaScript) {
    schemaScript.remove();
  }
};
