import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
const robotsPath = path.resolve(__dirname, '../public/robots.txt');

function runValidation() {
  console.log('[Validation] Starting local validation of SEO assets...\n');

  let errors = 0;

  // 1. Validate robots.txt
  console.log('[robots.txt] Checking file existence and content...');
  if (!fs.existsSync(robotsPath)) {
    console.error('❌ Error: robots.txt does not exist at ' + robotsPath);
    errors++;
  } else {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8').trim();
    console.log('--- robots.txt content ---');
    console.log(robotsContent);
    console.log('--------------------------');

    // Check lines
    const lines = robotsContent.split('\n').map(l => l.trim()).filter(Boolean);
    const hasUserAgent = lines.some(l => l.startsWith('User-agent:'));
    const hasAllow = lines.some(l => l.startsWith('Allow:'));
    const hasSitemap = lines.some(l => l.startsWith('Sitemap:'));
    const correctSitemap = lines.some(l => l.toLowerCase() === 'sitemap: https://www.molvbriv.in/sitemap.xml');

    if (!hasUserAgent) {
      console.error('❌ Error: robots.txt is missing "User-agent" directive.');
      errors++;
    }
    if (!hasAllow) {
      console.error('❌ Error: robots.txt is missing "Allow" directive.');
      errors++;
    }
    if (!hasSitemap) {
      console.error('❌ Error: robots.txt is missing "Sitemap" directive.');
      errors++;
    } else if (!correctSitemap) {
      console.error('❌ Error: robots.txt Sitemap directive does not point exactly to: https://www.molvbriv.in/sitemap.xml');
      errors++;
    } else {
      console.log('✅ robots.txt format is valid.');
    }
  }

  console.log('\n[sitemap.xml] Checking file existence and XML structure...');
  // 2. Validate sitemap.xml
  if (!fs.existsSync(sitemapPath)) {
    console.error('❌ Error: sitemap.xml does not exist at ' + sitemapPath);
    errors++;
  } else {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8').trim();

    // Check xml declaration and urlset tag
    if (!sitemapContent.startsWith('<?xml')) {
      console.error('❌ Error: sitemap.xml does not start with XML declaration.');
      errors++;
    }
    if (!sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
      console.error('❌ Error: sitemap.xml missing standard sitemaps.org urlset namespace.');
      errors++;
    }
    if (!sitemapContent.endsWith('</urlset>')) {
      console.error('❌ Error: sitemap.xml does not end with closed </urlset> tag.');
      errors++;
    }

    // Parse URLs using a simple regex match since we want to check every URL
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;
    const urls = [];
    while ((match = locRegex.exec(sitemapContent)) !== null) {
      urls.push(match[1]);
    }

    console.log(`[sitemap.xml] Found ${urls.length} URLs in the sitemap.`);

    if (urls.length === 0) {
      console.error('❌ Error: No <loc> tags found in sitemap.xml.');
      errors++;
    }

    urls.forEach(url => {
      // Every URL must start with the canonical domain
      if (!url.startsWith('https://www.molvbriv.in')) {
        console.error(`❌ Error: URL does not use canonical domain: ${url}`);
        errors++;
      }
      
      // Ensure no trailing spaces or weird characters
      if (url.trim() !== url) {
        console.error(`❌ Error: URL has trailing/leading whitespace: "${url}"`);
        errors++;
      }

      // Check for common typo issues
      if (url.includes('//product//') || url.includes('/undefined') || url.includes('/null')) {
        console.error(`❌ Error: Invalid URL path detected: ${url}`);
        errors++;
      }
    });

    if (errors === 0) {
      console.log('✅ sitemap.xml structure and all URLs are fully valid.');
    }
  }

  console.log('\n=========================================');
  if (errors > 0) {
    console.error(`❌ Validation Failed: ${errors} errors found.`);
    process.exit(1);
  } else {
    console.log('🎉 Validation Succeeded! All SEO checks passed.');
    process.exit(0);
  }
}

runValidation();
