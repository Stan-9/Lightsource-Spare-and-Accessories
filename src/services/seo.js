/**
 * Dynamic SEO & Structured Data Injection Helper
 */
export const updateSEO = ({ title, description, canonicalUrl, schemaData }) => {
  if (typeof window === 'undefined') return;

  // 1. Title
  if (title) {
    document.title = `${title} | LightSource Motors`;
  }

  // 2. Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (description) {
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }

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
