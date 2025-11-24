const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando verificación de páginas...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📍 [1/2] Testing login page access...');
    const loginResponse = await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 5000 });
    console.log(`Status: ${loginResponse.status()}`);
    console.log(`URL: ${page.url()}\n`);

    if (loginResponse.status() === 200) {
      console.log('✅ Login page accessible\n');

      console.log('📍 [2/2] Testing direct dashboard access (before login)...');
      const dashboardResponse = await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 5000 });
      console.log(`Status: ${dashboardResponse.status()}`);
      console.log(`URL: ${page.url()}`);
      console.log(`Should redirect to login if not authenticated\n`);

      if (page.url().includes('/login')) {
        console.log('✅ Redirect to login working correctly\n');
      } else {
        console.log('⚠️  Dashboard accessible without login\n');
      }

      // Now test pages list
      console.log('📊 Testing all pages after login...\n');
      
      console.log('Filling login form...');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      
      console.log('Submitting login...');
      await page.click('button[type="submit"]');

      console.log('Waiting for redirect...');
      try {
        await page.waitForURL(url => !url.includes('/login'), { timeout: 8000 });
        console.log('✅ Login successful\n');
        console.log(`Redirected to: ${page.url()}\n`);

        // Test each page
        const testPages = [
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

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Testing dashboard pages:\n');

        let results = { pass: 0, fail: 0 };

        for (const pagePath of testPages) {
          try {
            const response = await page.goto(`http://localhost:3000${pagePath}`, { 
              waitUntil: 'networkidle',
              timeout: 6000 
            });
            
            const status = response.status();
            const title = await page.title();
            
            if (status === 200) {
              console.log(`✅ ${pagePath} (${status}) - ${title}`);
              results.pass++;
            } else {
              console.log(`❌ ${pagePath} (${status})`);
              results.fail++;
            }
          } catch (err) {
            console.log(`❌ ${pagePath} (TIMEOUT/ERROR)`);
            results.fail++;
          }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 RESULTADOS FINALES:`);
        console.log(`✅ Exitosas: ${results.pass}/${testPages.length}`);
        console.log(`❌ Fallidas: ${results.fail}/${testPages.length}`);
        console.log(`Success Rate: ${Math.round((results.pass/testPages.length)*100)}%\n`);

      } catch (err) {
        console.log(`❌ Login failed: ${err.message}`);
      }
    } else {
      console.log(`❌ Login page not accessible (Status: ${loginResponse.status()})\n`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
})();
