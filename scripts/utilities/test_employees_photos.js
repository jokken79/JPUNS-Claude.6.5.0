const { chromium } = require('playwright');

async function testEmployeePhotos() {
  console.log('Starting employee photo display test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Collect console errors
  const consoleErrors = [];
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  try {
    // Step 1: Login
    console.log('\n=== STEP 1: Logging in ===');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Login successful');

    // Step 2: Clear localStorage for employees page
    console.log('\n=== STEP 2: Clearing localStorage ===');
    await page.evaluate(() => {
      localStorage.removeItem('employeeVisibleColumns');
      localStorage.removeItem('employeeColumnWidths');
      console.log('Cleared employeeVisibleColumns and employeeColumnWidths');
    });

    // Step 3: Navigate to employees page
    console.log('\n=== STEP 3: Navigating to employees page ===');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for photos to load
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\05_employees_after_clear_ls.png', fullPage: true });
    console.log('Screenshot saved: 05_employees_after_clear_ls.png');

    // Step 4: Check localStorage
    console.log('\n=== STEP 4: Checking localStorage ===');
    const localStorageData = await page.evaluate(() => {
      return {
        employeeVisibleColumns: localStorage.getItem('employeeVisibleColumns'),
        employeeColumnWidths: localStorage.getItem('employeeColumnWidths')
      };
    });
    console.log('localStorage data:', JSON.stringify(localStorageData, null, 2));

    // Step 5: Check for photo elements
    console.log('\n=== STEP 5: Analyzing photo elements ===');
    const photoInfo = await page.evaluate(() => {
      const imgTags = Array.from(document.querySelectorAll('img[src^="data:image"]'));
      const allImgTags = Array.from(document.querySelectorAll('img'));
      const tableRows = document.querySelectorAll('tbody tr');

      return {
        totalImages: allImgTags.length,
        dataImageCount: imgTags.length,
        tableRowCount: tableRows.length,
        photoSources: imgTags.slice(0, 5).map(img => ({
          src: img.src.substring(0, 100) + '...',
          alt: img.alt,
          width: img.width,
          height: img.height,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          className: img.className
        })),
        allImageSources: allImgTags.map(img => ({
          src: img.src.substring(0, 80),
          alt: img.alt,
          className: img.className
        }))
      };
    });

    console.log('Total img tags:', photoInfo.totalImages);
    console.log('Images with data:image src:', photoInfo.dataImageCount);
    console.log('Table rows:', photoInfo.tableRowCount);
    console.log('Photo sources:', JSON.stringify(photoInfo.photoSources, null, 2));
    console.log('\nAll image sources:');
    photoInfo.allImageSources.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.src} (${img.alt}) [${img.className}]`);
    });

    // Step 6: Check API response
    console.log('\n=== STEP 6: Checking API response ===');
    const apiResponse = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/employees/?page=1&page_size=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return {
        total: data.total,
        itemsCount: data.items ? data.items.length : 0,
        firstEmployees: data.items ? data.items.slice(0, 3).map(e => ({
          id: e.id,
          hakenmoto_id: e.hakenmoto_id,
          full_name_kanji: e.full_name_kanji,
          has_photo_data_url: !!e.photo_data_url,
          photo_length: e.photo_data_url ? e.photo_data_url.length : 0,
          photo_preview: e.photo_data_url ? e.photo_data_url.substring(0, 60) : null
        })) : []
      };
    });

    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

    // Step 7: Check console errors
    console.log('\n=== STEP 7: Console Messages ===');
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');

    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errorMessages.length}`);
    console.log(`Warnings: ${warningMessages.length}`);

    if (errorMessages.length > 0) {
      console.log('\nConsole Errors:');
      errorMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.text}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\nPage Errors:');
      consoleErrors.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg}`);
      });
    }

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`✓ Table rows: ${photoInfo.tableRowCount}`);
    console.log(`✓ API employees: ${apiResponse.itemsCount}`);
    console.log(`✓ Employees with photos in API: ${apiResponse.firstEmployees.filter(e => e.has_photo_data_url).length}/${apiResponse.firstEmployees.length}`);
    console.log(`✓ Photo images rendered: ${photoInfo.dataImageCount}`);
    console.log(`✓ Console errors: ${errorMessages.length + consoleErrors.length}`);

    if (photoInfo.dataImageCount > 0) {
      console.log('\n✅ SUCCESS: Photos are displaying on employees page!');
    } else {
      console.log('\n⚠️  WARNING: Photos NOT displaying - API has photos but frontend not rendering them');
    }

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\error_employees.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nBrowser closed. Test complete.');
  }
}

testEmployeePhotos();
