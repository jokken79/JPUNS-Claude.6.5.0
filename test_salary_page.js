const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('[TEST] Iniciando login...');
    
    // Login
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('[TEST] Login exitoso, URL:', page.url());

    // Test salary page
    console.log('\n[SALARY TEST] Accediendo a /dashboard/salary...');
    const response = await page.goto('http://localhost:3000/dashboard/salary', { 
      waitUntil: 'networkidle' 
    });
    
    console.log(`[SALARY] Status: ${response.status()}`);
    console.log(`[SALARY] URL actual: ${page.url()}`);
    
    // Verificar que el titulo existe
    const pageTitle = await page.title();
    console.log(`[SALARY] Page title: ${pageTitle}`);
    
    // Buscar elementos en la página
    const heading = await page.$eval('h1, h2, [role="heading"]', el => el.textContent).catch(() => null);
    console.log(`[SALARY] Heading encontrado: ${heading || 'No encontrado'}`);

    if (response.status() === 200) {
      console.log('\n✅ [SALARY] PÁGINA ACCESIBLE - Status 200');
    } else {
      console.log(`\n❌ [SALARY] ERROR - Status ${response.status()}`);
    }

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await browser.close();
  }
})();
