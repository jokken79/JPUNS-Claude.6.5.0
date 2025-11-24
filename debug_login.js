const { chromium } = require('playwright');

(async () => {
  console.log('🔐 VERIFICACIÓN DETALLADA DE LOGIN\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const browser = await chromium.launch({ headless: false }); // headless: false para ver lo que ocurre
  const context = await browser.newContext();
  const page = await context.newPage();

  // Interceptar todos los errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`  [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  try {
    console.log('Step 1: Accessing login page...\n');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    
    // Check localStorage before login
    const localStorageBeforeLogin = await page.evaluate(() => {
      return {
        'auth-storage': localStorage.getItem('auth-storage'),
        'token': localStorage.getItem('token'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log('localStorage before login:', localStorageBeforeLogin);
    console.log('');

    console.log('Step 2: Filling credentials...\n');
    await page.waitForSelector('input#username', { timeout: 5000 });
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    
    console.log('Step 3: Submitting form...\n');
    await page.click('button[type="submit"]');
    
    // Wait for any response
    await page.waitForTimeout(3000);
    
    // Check localStorage after login attempt
    const localStorageAfterLogin = await page.evaluate(() => {
      return {
        'auth-storage': localStorage.getItem('auth-storage'),
        'token': localStorage.getItem('token'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log('localStorage after login:', localStorageAfterLogin);
    console.log('');

    console.log('Current URL:', page.url());
    console.log('');

    // Check if token is actually in localStorage
    if (localStorageAfterLogin['auth-storage']) {
      const authData = JSON.parse(localStorageAfterLogin['auth-storage']);
      console.log('Auth data in localStorage:', {
        hasToken: !!authData.state?.token,
        tokenPrefix: authData.state?.token?.substring(0, 20) + '...',
        isAuthenticated: authData.state?.isAuthenticated,
      });
      console.log('');
    }

    // Try navigating directly to dashboard
    console.log('Step 4: Attempting to navigate to /dashboard...\n');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    console.log('Final URL:', page.url());
    
    // Check if we're on dashboard or redirected back to login
    if (page.url().includes('/login')) {
      console.log('\n❌ PROBLEM: Still on login page!');
      console.log('Token might not be persisted correctly.');
    } else {
      console.log('\n✅ SUCCESS: Navigated to dashboard!');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    // Keep browser open for 5 seconds to see the state
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
