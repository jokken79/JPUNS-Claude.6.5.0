const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 [1/5] Accessing login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    console.log('✓ Login page loaded\n');

    console.log('📝 [2/5] Logging in with admin/admin123...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Login successful\n');

    // Wait a bit for redirect
    await page.waitForTimeout(2000);

    console.log('📍 [3/5] Checking current URL after login...');
    console.log(`Current URL: ${page.url()}\n`);

    const pages = [
      '/dashboard',
      '/dashboard/candidates',
      '/dashboard/employees',
      '/dashboard/factories',
      '/dashboard/timercards',
      '/dashboard/payroll',
      '/dashboard/requests',
      '/dashboard/settings',
      '/dashboard/themes'
    ];

    console.log('📊 [4/5] Testing each page...\n');
    let passCount = 0;
    let failCount = 0;

    for (const pagePath of pages) {
      try {
        console.log(`→ Testing ${pagePath}...`);
        await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle', timeout: 8000 });

        const url = page.url();
        const pageTitle = await page.title();
        const bodyHTML = await page.content();
        
        // More detailed error checking
        const has404 = bodyHTML.includes('404') || bodyHTML.includes('not found');
        const hasErrorMsg = bodyHTML.includes('Error') && !bodyHTML.includes('error-handling');
        const isBlank = bodyHTML.replace(/\s/g, '').length < 100;

        if (has404 || isBlank) {
          console.log(`  ❌ FAILED`);
          console.log(`     URL: ${url}`);
          console.log(`     Title: ${pageTitle}`);
          if (has404) console.log(`     Issue: 404 detected`);
          if (isBlank) console.log(`     Issue: Page appears blank`);
          failCount++;
        } else {
          console.log(`  ✅ SUCCESS`);
          console.log(`     URL: ${url}`);
          console.log(`     Title: ${pageTitle}`);
          passCount++;
        }
      } catch (error) {
        console.log(`  ⚠️  ERROR - ${error.message.substring(0, 60)}`);
        failCount++;
      }
      console.log();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 [5/5] TEST RESULTS`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ PASSED: ${passCount}/${pages.length}`);
    console.log(`❌ FAILED: ${failCount}/${pages.length}`);
    console.log(`Success Rate: ${Math.round((passCount/pages.length)*100)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await context.close();
    await browser.close();
  }
})();
