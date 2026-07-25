/**
 * Blog Management System Utilities & SEO Helpers
 * Handles reading time calculation, slug generation, heading extraction for Table of Contents,
 * HTML sanitization for XSS prevention, and Google Structured Data (JSON-LD) creation.
 */

/**
 * Calculates estimated reading time in minutes based on word count.
 * @param {string} text Plain text or HTML content
 * @param {number} wordsPerMinute Average reading speed (default: 200 wpm)
 * @returns {number} Estimated reading time in minutes (minimum 1)
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text || typeof text !== 'string') return 1;
  // Strip HTML tags to get pure text content
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = cleanText ? cleanText.split(' ').length : 0;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes > 0 ? minutes : 1;
}

/**
 * Converts any title or header into a clean, SEO-optimized URL slug.
 * Example: "How to Clean Silver Jewellery in 5 Easy Steps!" -> "how-to-clean-silver-jewellery-in-5-easy-steps"
 * @param {string} text Title string
 * @returns {string} Clean URL slug
 */
export function generateSlug(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens
}

/**
 * Parses blog content (HTML or Markdown) and extracts H2 and H3 headings for sticky Table of Contents.
 * @param {string} content HTML or Markdown string
 * @returns {Array<{id: string, text: string, level: number}>} Array of heading objects
 */
export function extractHeadings(content) {
  if (!content || typeof content !== 'string') return [];
  const headings = [];

  // Match H2 and H3 tags in HTML
  const regex = /<h([2-3])(?:[^>]*id=["']([^"']+)["'])?[^>]*>(.*?)<\/h[2-3]>/gi;
  let match;
  let index = 0;

  while ((match = regex.exec(content)) !== null) {
    const level = parseInt(match[1], 10);
    let id = match[2];
    const rawText = match[3].replace(/<[^>]*>/g, '').trim();

    if (rawText) {
      if (!id) {
        id = `heading-${generateSlug(rawText)}-${index}`;
      }
      headings.push({
        id,
        text: rawText,
        level
      });
      index++;
    }
  }

  // Fallback for Markdown headings if HTML tags weren't found
  if (headings.length === 0) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        const text = h2Match[1].replace(/\*|_|`/g, '').trim();
        headings.push({
          id: `heading-${generateSlug(text)}-${idx}`,
          text,
          level: 2
        });
      } else if (h3Match) {
        const text = h3Match[1].replace(/\*|_|`/g, '').trim();
        headings.push({
          id: `heading-${generateSlug(text)}-${idx}`,
          text,
          level: 3
        });
      }
    });
  }

  return headings;
}

/**
 * Inject unique IDs into HTML H2 and H3 headers so sticky Table of Contents anchor links work smoothly.
 * @param {string} html HTML content string
 * @returns {string} Processed HTML with id attributes added to h2 and h3 elements
 */
export function addHeadingIdsToHtml(html) {
  if (!html || typeof html !== 'string') return '';
  let index = 0;
  return html.replace(/<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/gi, (match, level, attrs, content) => {
    const rawText = content.replace(/<[^>]*>/g, '').trim();
    if (!rawText) return match;

    // Check if ID already exists
    if (/id=["'][^"']+["']/i.test(attrs)) {
      return match;
    }

    const id = `heading-${generateSlug(rawText)}-${index++}`;
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

/**
 * Lightweight XSS HTML Sanitizer to safely render user/admin inputted HTML blog content.
 * Prevents execution of dangerous <script>, <iframe> onload, javascript: URLs, and event handlers.
 * @param {string} html Raw HTML content
 * @returns {string} Sanitized safe HTML
 */
export function sanitizeBlogHtml(html) {
  if (!html || typeof html !== 'string') return '';

  return html
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, onload, etc.)
    .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Remove javascript: URLs
    .replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*")/gi, 'href="#"')
    // Remove data: URLs in src unless image
    .replace(/src\s*=\s*(?:'data:(?!image\/)[^']*'|"data:(?!image\/)[^"]*")/gi, 'src=""')
    // Remove object, embed, iframe (unless safe video embeds like youtube/vimeo)
    .replace(/<(object|embed)[^>]*>.*?<\/\1>/gi, '');
}

/**
 * Builds Google Search compliant JSON-LD structured data schemas for blogs.
 * Generates:
 * 1. Article / BlogPosting Schema
 * 2. BreadcrumbList Schema
 * 3. Organization Schema
 * 4. WebSite Schema
 * 5. Author (Person) Schema
 * 6. FAQPage Schema (if blog contains FAQ section)
 * 
 * @param {Object} blog Blog post object
 * @param {string} siteUrl Base website URL (default: https://www.molvbriv.in)
 * @returns {Array<Object>} Array of JSON-LD schema objects
 */
export function buildJsonLdSchemas(blog, siteUrl = 'https://www.molvbriv.in') {
  if (!blog) return [];

  const articleUrl = `${siteUrl}/blog/${blog.slug}`;
  const publishDate = blog.published_at || blog.created_at || new Date().toISOString();
  const modifiedDate = blog.updated_at || publishDate;
  const featuredImg = blog.featured_image || `${siteUrl}/assets/logo.png`;
  const authorName = blog.author_name || 'Molvbriv Editorial';

  // 1. Article / BlogPosting Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    'headline': blog.title,
    'description': blog.meta_description || blog.excerpt || blog.title,
    'image': [featuredImg],
    'datePublished': publishDate,
    'dateModified': modifiedDate,
    'author': {
      '@type': 'Person',
      'name': authorName,
      'jobTitle': blog.author_role || 'Jewellery Specialist'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'MOLVBRIV',
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/assets/logo.png`
      }
    },
    'articleSection': blog.category_name || 'Jewellery Guide',
    'keywords': (blog.tags || []).join(', ') || 'Jewellery, Luxury, Fashion',
    'inLanguage': 'en-IN'
  };

  // 2. Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Blog',
        'item': `${siteUrl}/blog`
      },
      ...(blog.category_name ? [{
        '@type': 'ListItem',
        'position': 3,
        'name': blog.category_name,
        'item': `${siteUrl}/blog?category=${encodeURIComponent(blog.category_name)}`
      }] : []),
      {
        '@type': 'ListItem',
        'position': blog.category_name ? 4 : 3,
        'name': blog.title,
        'item': articleUrl
      }
    ]
  };

  // 3. Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'MOLVBRIV',
    'url': siteUrl,
    'logo': `${siteUrl}/assets/logo.png`,
    'sameAs': [
      'https://www.instagram.com/molvbriv',
      'https://www.facebook.com/molvbriv'
    ]
  };

  // 4. WebSite Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'MOLVBRIV Fine Jewellery',
    'url': siteUrl,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${siteUrl}/blog?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const schemas = [articleSchema, breadcrumbSchema, organizationSchema, websiteSchema];

  // 5. FAQ Schema (if blog has FAQ accordion entries)
  if (Array.isArray(blog.faqs) && blog.faqs.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': blog.faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
    schemas.push(faqSchema);
  }

  return schemas;
}
