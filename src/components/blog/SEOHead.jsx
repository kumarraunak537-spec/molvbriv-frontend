import React, { useEffect } from 'react';
import { buildJsonLdSchemas } from '../../utils/blogUtils';

/**
 * SEOHead Component
 * Dynamically updates head title, meta tags, Open Graph, Twitter Cards, canonical link,
 * and structured JSON-LD schema scripts for maximum Google Search optimization.
 */
export default function SEOHead({ blog, customTitle, customDescription, canonicalUrl }) {
  const siteUrl = 'https://www.molvbriv.in';
  
  const title = customTitle || (blog ? (blog.meta_title || `${blog.title} | Molvbriv Journal`) : 'Molvbriv Journal | Fine Jewellery & Craftsmanship Blog');
  const description = customDescription || (blog ? (blog.meta_description || blog.excerpt || 'Explore luxury jewellery care, styling guides, and artisan heritage.') : 'Official blog of Molvbriv. Discover expert guides on sterling silver jewellery care, traditional Jhumka styling, and artisan craftsmanship.');
  const pageCanonical = canonicalUrl || (blog ? (blog.canonical_url || `${siteUrl}/blog/${blog.slug}`) : `${siteUrl}/blog`);
  const imageUrl = blog?.featured_image || `${siteUrl}/assets/logo.png`;
  const publishDate = blog?.published_at || blog?.created_at || new Date().toISOString();

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // Helper to create or update meta element
    const setMetaTag = (name, value, isProperty = false) => {
      if (!value) return;
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
    };

    // 2. Update Standard Meta Tags
    setMetaTag('description', description);
    setMetaTag('keywords', blog?.meta_keywords || 'jewellery, silver jewellery, jhumkas, molvbriv, luxury accessories');
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('author', blog?.author_name || 'Molvbriv Editorial');

    // 3. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageCanonical);

    // 4. Update Open Graph Tags
    setMetaTag('og:site_name', 'MOLVBRIV', true);
    setMetaTag('og:type', blog ? 'article' : 'website', true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', pageCanonical, true);
    setMetaTag('og:image', imageUrl, true);
    setMetaTag('og:locale', 'en_IN', true);

    if (blog) {
      setMetaTag('article:published_time', publishDate, true);
      setMetaTag('article:section', blog.category_name || 'Jewellery', true);
      if (Array.isArray(blog.tags)) {
        blog.tags.forEach(tag => setMetaTag('article:tag', tag, true));
      }
    }

    // 5. Update Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', imageUrl);

    // 6. Inject JSON-LD Structured Data Scripts
    // Remove old blog schema script tags if existing
    const existingSchemas = document.querySelectorAll('script[data-blog-schema="true"]');
    existingSchemas.forEach(el => el.remove());

    if (blog) {
      const schemas = buildJsonLdSchemas(blog, siteUrl);
      schemas.forEach((schemaObj, idx) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-blog-schema', 'true');
        script.text = JSON.stringify(schemaObj);
        document.head.appendChild(script);
      });
    }

    return () => {
      // Clean up injected script tags when navigating away
      const injected = document.querySelectorAll('script[data-blog-schema="true"]');
      injected.forEach(el => el.remove());
    };
  }, [title, description, pageCanonical, imageUrl, blog]);

  return null;
}
