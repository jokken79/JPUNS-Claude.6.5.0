const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let consoleErrors = [];
  let networkErrors = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: 'console',
        message: msg.text(),
        location: msg.location()
      });
    }
  });

  // Capture network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure().errorText
    });
  });

  try {
    console.log('🔐 Accediendo al login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    console.log('📝 Ingresando credenciales...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    console.log('✅ Haciendo click en login...');
    await page.click('button[type="submit"]');

    console.log('⏳ Esperando redirección al dashboard...');
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (e) {
      console.log('⚠️ Timeout esperando dashboard, continuando...');
    }

    await page.waitForTimeout(3000);

    console.log('\n📊 ERRORES ENCONTRADOS:\n');

    if (consoleErrors.length > 0) {
      console.log(`\n🔴 CONSOLE ERRORS (${consoleErrors.length}):`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i+1}. ${err.message}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log(`\n🔴 NETWORK ERRORS (${networkErrors.length}):`);
      networkErrors.forEach((err, i) => {
        if (err.status) {
          console.log(`  ${i+1}. ${err.status} ${err.statusText} - ${err.url}`);
        } else {
          console.log(`  ${i+1}. FAILED - ${err.url} - ${err.failure}`);
        }
      });
    }

    if (consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log('✅ No se encontraron errores');
    }

    console.log('\n📸 Página actual:', page.url());

    // Check if we're on dashboard
    const pageContent = await page.content();
    if (pageContent.includes('dashboard') || pageContent.includes('Dashboard')) {
      console.log('✅ Dashboard cargado correctamente');
    } else {
      console.log('⚠️ Posible problema - no se detectó contenido de dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
