const { chromium } = require('playwright');

(async () => {
  console.log('🧪 TEST MEJORADO CON MANEJO DE COOKIES Y ESTADO\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all network requests and responses
  const requestLog = [];
  
  page.on('request', request => {
    requestLog.push({
      url: request.url(),
      method: request.method(),
      status: 'pending'
    });
  });

  page.on('response', response => {
    const url = response.url();
    const method = response.request().method();
    const status = response.status();
    console.log(`[${method}] ${url.split('?')[0]} → ${status}`);
  });

  try {
    console.log('📍 [1] Accediendo a login...\n');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Get initial localStorage state
    const initialLS = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('auth-storage') || '{}');
    });
    console.log('Initial localStorage:', initialLS);
    console.log();

    console.log('📍 [2] Llenando formulario de login...\n');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');

    console.log('📍 [3] Enviando formulario...\n');
    await page.click('button[type="submit"]');

    // Wait for any navigation/redirect
    await page.waitForTimeout(2000);
    
    // Check localStorage after login
    const afterLoginLS = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('auth-storage') || '{}');
    });
    console.log('\nAfter login localStorage:');
    console.log('- token:', afterLoginLS.token ? afterLoginLS.token.substring(0, 20) + '...' : 'null');
    console.log('- isAuthenticated:', afterLoginLS.isAuthenticated);
    console.log('- user:', afterLoginLS.user?.username);
    console.log();

    // Check auth cookies
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'uns-auth-token');
    console.log('Auth Cookie:', authCookie ? 'present' : 'missing');
    console.log();

    const currentURL = page.url();
    console.log('📍 [4] Current URL:', currentURL);
    console.log();

    if (currentURL.includes('/login')) {
      console.log('⚠️  Still on login page! Testing direct dashboard access...\n');
    }

    // Now test if dashboard is accessible
    console.log('📍 [5] Testing dashboard access...\n');
    
    const dashboardResponse = await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle',
      timeout: 8000
    });
    
    console.log('Dashboard status:', dashboardResponse?.status());
    console.log('Dashboard URL:', page.url());
    console.log();

    // Test each page with better error handling
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

    console.log('📊 [6] Probando todas las páginas:\n');
    console.log('═══════════════════════════════════════════════════════\n');

    let passed = 0;
    let failed = 0;

    for (const pagePath of testPages) {
      try {
        const response = await page.goto(`http://localhost:3000${pagePath}`, {
          waitUntil: 'networkidle',
          timeout: 8000
        });

        const status = response?.status() || 0;
        const finalURL = page.url();
        const hasContent = await page.evaluate(() => document.body.textContent.trim().length > 100);

        if (status === 200 && hasContent) {
          console.log(`✅ ${pagePath.padEnd(30)} [${status}]`);
          passed++;
        } else {
          console.log(`❌ ${pagePath.padEnd(30)} [${status}] → ${finalURL}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${pagePath.padEnd(30)} [ERROR] ${error.message.substring(0, 40)}`);
        failed++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('📊 RESULTADOS FINALES\n');
    console.log(`✅ Pasadas: ${passed}/${testPages.length}`);
    console.log(`❌ Fallidas: ${failed}/${testPages.length}`);
    console.log(`Rate: ${Math.round((passed/testPages.length)*100)}%\n`);

  } catch (error) {
    console.error('❌ Error en test:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
})();
