export function updateSEO(metadata = {}) {
  const {
    title = "Molvbriv — The Timeless Curator",
    description = "Molvbriv — Luxury fine jewelry crafted with timeless elegance since 1904. Discover our Heritage Collection of handcrafted rings, necklaces, earrings and more.",
    canonicalUrl = window.location.origin + window.location.pathname,
    ogType = "website",
    ogImage = "https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=1200&h=630&fit=crop"
  } = metadata;

  // 1. Update Title
  document.title = title;

  // 2. Update Meta Description
  updateMetaTag('name', 'description', description);

  // 3. Update Canonical Link
  updateLinkTag('rel', 'canonical', canonicalUrl);

  // 4. Update Open Graph Tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:type', ogType);
  updateMetaTag('property', 'og:url', canonicalUrl);
  updateMetaTag('property', 'og:image', ogImage);

  // 5. Update Twitter Card Tags
  updateMetaTag('property', 'twitter:title', title);
  updateMetaTag('property', 'twitter:description', description);
  updateMetaTag('property', 'twitter:url', canonicalUrl);
  updateMetaTag('property', 'twitter:image', ogImage);
}

function updateMetaTag(attributeName, attributeValue, contentValue) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', contentValue);
}

function updateLinkTag(attributeName, attributeValue, hrefValue) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`link[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('href', hrefValue);
}
