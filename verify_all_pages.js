const { chromium } = require('playwright');

(async () => {
  console.log('🚀 VERIFICACIÓN COMPLETA DE APLICACIÓN\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set up error handling
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`  ⚠️  JS Error: ${msg.text()}`);
    }
  });

  try {
    console.log('📍 [1/3] VERIFICANDO ACCESO AL LOGIN\n');
    const loginResponse = await page.goto('http://localhost:3000/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    console.log(`Status: ${loginResponse.status()}`);
    console.log(`URL: ${page.url()}\n`);

    if (loginResponse.status() === 200) {
      console.log('✅ Login page accessible\n');

      console.log('📝 [2/3] REALIZANDO LOGIN\n');
      
      // Wait for the input fields to appear
      await page.waitForSelector('input#username', { timeout: 5000 });
      console.log('✓ Username field found');
      
      await page.waitForSelector('input#password', { timeout: 5000 });
      console.log('✓ Password field found');
      
      // Fill in credentials
      await page.fill('input#username', 'admin');
      console.log('✓ Username filled');
      
      await page.fill('input#password', 'admin123');
      console.log('✓ Password filled');
      
      // Find and click the submit button
      await page.click('button[type="submit"]');
      console.log('✓ Submit button clicked\n');

      // Wait for redirect
      try {
        await page.waitForURL(url => !url.includes('/login'), { timeout: 10000 });
        console.log('✅ Login successful, redirected from login page\n');
      } catch (err) {
        console.log('⚠️  Login redirect timeout, but continuing test\n');
      }

      console.log(`Current URL: ${page.url()}\n`);

      // Now test all dashboard pages
      console.log('📊 [3/3] PROBANDO TODAS LAS PÁGINAS DEL DASHBOARD\n');
      console.log('═══════════════════════════════════════════════════════\n');

      const testPages = [
        { path: '/dashboard', name: 'Dashboard Principal' },
        { path: '/dashboard/candidates', name: 'Candidatos' },
        { path: '/dashboard/employees', name: 'Empleados' },
        { path: '/dashboard/factories', name: 'Fábricas' },
        { path: '/dashboard/timercards', name: 'Tarjetas de Tiempo' },
        { path: '/dashboard/payroll', name: 'Nómina' },
        { path: '/dashboard/requests', name: 'Solicitudes' },
        { path: '/dashboard/settings', name: 'Configuración' },
        { path: '/dashboard/themes', name: 'Temas' }
      ];

      let results = { pass: 0, fail: 0, details: [] };

      for (const page_info of testPages) {
        try {
          console.log(`→ Probando ${page_info.name}...`);
          
          const response = await page.goto(`http://localhost:3000${page_info.path}`, { 
            waitUntil: 'networkidle',
            timeout: 8000 
          });
          
          const status = response.status();
          const title = await page.title();
          const url = page.url();
          
          // Check if page loaded properly
          const hasContent = await page.evaluate(() => {
            const body = document.body;
            return body.children.length > 0 && body.textContent.trim().length > 0;
          });

          if (status === 200 && hasContent) {
            console.log(`  ✅ SUCCESS (${status})`);
            console.log(`     Title: ${title}`);
            console.log(`     URL: ${url}\n`);
            results.pass++;
            results.details.push({
              page: page_info.name,
              status: '✅',
              code: status
            });
          } else {
            console.log(`  ❌ FAILED (${status})`);
            console.log(`     Title: ${title}`);
            console.log(`     Content loaded: ${hasContent}`);
            console.log(`     URL: ${url}\n`);
            results.fail++;
            results.details.push({
              page: page_info.name,
              status: '❌',
              code: status
            });
          }
        } catch (err) {
          console.log(`  ❌ ERROR - ${err.message.substring(0, 50)}\n`);
          results.fail++;
          results.details.push({
            page: page_info.name,
            status: '❌',
            code: 'ERROR'
          });
        }
      }

      console.log('═══════════════════════════════════════════════════════\n');
      console.log('📊 RESUMEN FINAL\n');
      console.log('═══════════════════════════════════════════════════════\n');
      
      results.details.forEach(item => {
        console.log(`${item.status} ${item.page.padEnd(25)} [${item.code}]`);
      });

      console.log('\n═══════════════════════════════════════════════════════');
      console.log(`\n✅ Exitosas: ${results.pass}/${testPages.length}`);
      console.log(`❌ Fallidas: ${results.fail}/${testPages.length}`);
      const successRate = Math.round((results.pass/testPages.length)*100);
      console.log(`Success Rate: ${successRate}%\n`);

      if (successRate === 100) {
        console.log('🎉 ¡TODAS LAS PÁGINAS FUNCIONAN CORRECTAMENTE! 🎉\n');
      } else if (successRate >= 80) {
        console.log('✅ La mayoría de páginas están funcionando bien\n');
      } else {
        console.log('⚠️  Hay problemas en varias páginas\n');
      }

    } else {
      console.log(`❌ Login page not accessible (Status: ${loginResponse.status()})\n`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await context.close();
    await browser.close();
  }
})();
