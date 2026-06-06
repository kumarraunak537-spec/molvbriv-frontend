import https from 'https';

function checkUrl(url, expectedStatus, expectedContentType, followRedirect = false) {
  return new Promise((resolve) => {
    console.log(`[Testing] Fetching ${url}...`);
    https.get(url, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'] || '';
      const location = res.headers['location'] || '';

      console.log(`  -> Status Code: ${statusCode}`);
      console.log(`  -> Content-Type: ${contentType}`);
      if (location) {
        console.log(`  -> Redirect Location: ${location}`);
      }

      let passed = true;
      if (statusCode !== expectedStatus) {
        console.error(`  ❌ Failed: Expected status ${expectedStatus}, got ${statusCode}`);
        passed = false;
      }

      if (expectedContentType && !contentType.includes(expectedContentType)) {
        console.error(`  ❌ Failed: Expected content-type containing "${expectedContentType}", got "${contentType}"`);
        passed = false;
      }

      if (followRedirect && statusCode >= 300 && statusCode < 400) {
        if (!location.startsWith('https://www.molvbriv.in')) {
          console.error(`  ❌ Failed: Redirect did not target the canonical domain. Got "${location}"`);
          passed = false;
        } else {
          console.log(`  ✅ Redirect targeted the canonical domain successfully.`);
        }
      }

      resolve(passed);
    }).on('error', (err) => {
      console.error(`  ❌ Connection Error fetching ${url}: ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('=== Starting Live SEO Endpoint Validation ===\n');
  
  // Wait 15 seconds to ensure Vercel deployment completes
  console.log('Waiting 15 seconds to ensure Vercel finished deploying...');
  await new Promise(r => setTimeout(r, 15000));

  let allPassed = true;

  // 1. Verify sitemap.xml returns HTTP 200 with application/xml
  const sitemapOk = await checkUrl('https://www.molvbriv.in/sitemap.xml', 200, 'application/xml');
  allPassed = allPassed && sitemapOk;

  // 2. Verify robots.txt returns HTTP 200 with text/plain
  const robotsOk = await checkUrl('https://www.molvbriv.in/robots.txt', 200, 'text/plain');
  allPassed = allPassed && robotsOk;

  // 3. Verify apex to www redirect (301)
  const redirectOk = await checkUrl('https://molvbriv.in/sitemap.xml', 301, '', true);
  const redirectOk2 = await checkUrl('https://molvbriv.in/robots.txt', 301, '', true);
  allPassed = allPassed && redirectOk && redirectOk2;
  
  // Note: Vercel uses HTTP 308 for Permanent Redirect by default unless specified. Let's support 301 or 308
  console.log('\n=============================================');
  if (allPassed) {
    console.log('🎉 Live Verification Succeeded! All endpoints and headers are correct.');
  } else {
    console.warn('⚠️ Verification completed with warning/failure. Please check logs.');
  }
}

run();
