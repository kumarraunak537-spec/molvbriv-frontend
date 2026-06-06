import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseKey = 'sb_publishable_AB0uoHT_3kBOtwTSoLVf3w_4y_a4uKd';
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://www.molvbriv.in';

const staticPages = [
  { route: '', priority: '1.0', changefreq: 'daily' },
  { route: '/collections', priority: '0.8', changefreq: 'weekly' },
  { route: '/all-products', priority: '0.9', changefreq: 'daily' },
  { route: '/new-arrivals', priority: '0.9', changefreq: 'daily' },
  { route: '/about', priority: '0.6', changefreq: 'monthly' },
  { route: '/shipping-returns', priority: '0.5', changefreq: 'monthly' },
  { route: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
  { route: '/terms-of-service', priority: '0.3', changefreq: 'monthly' },
  { route: '/track-order', priority: '0.5', changefreq: 'weekly' },
  { route: '/login', priority: '0.5', changefreq: 'monthly' }
];

async function generateSitemap() {
  console.log('[Sitemap] Starting sitemap generation...');
  try {
    // 1. Fetch products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`[Sitemap] Fetched ${products.length} products from Supabase.`);

    // 2. Start constructing XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // A. Add static pages
    staticPages.forEach(p => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${p.route}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // B. Add dynamic product pages
    products.forEach(prod => {
      const lastmod = prod.created_at ? new Date(prod.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/product/${prod.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>\n';

    // 3. Write to public/sitemap.xml
    const publicPath = path.resolve(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(publicPath, xml, 'utf8');
    console.log(`[Sitemap] Successfully wrote to ${publicPath}`);

    // 4. Also write to dist/sitemap.xml if the dist directory exists
    const distDir = path.resolve(__dirname, '../dist');
    if (fs.existsSync(distDir)) {
      const distPath = path.resolve(distDir, 'sitemap.xml');
      fs.writeFileSync(distPath, xml, 'utf8');
      console.log(`[Sitemap] Successfully wrote to ${distPath}`);
    }

    console.log('[Sitemap] Sitemap generation completed successfully!');
  } catch (err) {
    console.error('[Sitemap] Error generating sitemap:', err.message);
    process.exit(1);
  }
}

generateSitemap();
