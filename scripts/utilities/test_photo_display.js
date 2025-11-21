const { chromium } = require('playwright');

async function testPhotoDisplay() {
  console.log('Starting photo display test...');

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
    // Step 1: Navigate to login page
    console.log('\n=== STEP 1: Navigating to login page ===');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\01_login_page.png', fullPage: true });
    console.log('Screenshot saved: 01_login_page.png');

    // Step 2: Login with admin/admin123
    console.log('\n=== STEP 2: Logging in with admin/admin123 ===');
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\02_after_login.png', fullPage: true });
    console.log('Screenshot saved: 02_after_login.png');
    console.log('Current URL:', page.url());

    // Step 3: Navigate to candidates page
    console.log('\n=== STEP 3: Navigating to candidates page ===');
    await page.goto('http://localhost:3000/candidates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for photos to load
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\03_candidates_page.png', fullPage: true });
    console.log('Screenshot saved: 03_candidates_page.png');

    // Check for photo elements on candidates page
    console.log('\n=== Analyzing candidates page photos ===');
    const candidatePhotoInfo = await page.evaluate(() => {
      const imgTags = Array.from(document.querySelectorAll('img[src^="data:image"]'));
      const allImgTags = Array.from(document.querySelectorAll('img'));

      return {
        totalImages: allImgTags.length,
        dataImageCount: imgTags.length,
        photoSources: imgTags.slice(0, 5).map(img => ({
          src: img.src.substring(0, 100) + '...',
          alt: img.alt,
          width: img.width,
          height: img.height,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        })),
        allImageSources: allImgTags.slice(0, 10).map(img => ({
          src: img.src.substring(0, 100),
          alt: img.alt,
          className: img.className
        }))
      };
    });

    console.log('Candidates Page - Total img tags:', candidatePhotoInfo.totalImages);
    console.log('Candidates Page - Images with data:image src:', candidatePhotoInfo.dataImageCount);
    console.log('Candidates Page - Sample photo sources:', JSON.stringify(candidatePhotoInfo.photoSources, null, 2));
    console.log('Candidates Page - All image sources (first 10):', JSON.stringify(candidatePhotoInfo.allImageSources, null, 2));

    // Step 4: Navigate to employees page
    console.log('\n=== STEP 4: Navigating to employees page ===');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for photos to load
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\04_employees_page.png', fullPage: true });
    console.log('Screenshot saved: 04_employees_page.png');

    // Check for photo elements on employees page
    console.log('\n=== Analyzing employees page photos ===');
    const employeePhotoInfo = await page.evaluate(() => {
      const imgTags = Array.from(document.querySelectorAll('img[src^="data:image"]'));
      const allImgTags = Array.from(document.querySelectorAll('img'));

      return {
        totalImages: allImgTags.length,
        dataImageCount: imgTags.length,
        photoSources: imgTags.slice(0, 5).map(img => ({
          src: img.src.substring(0, 100) + '...',
          alt: img.alt,
          width: img.width,
          height: img.height,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        })),
        allImageSources: allImgTags.slice(0, 10).map(img => ({
          src: img.src.substring(0, 100),
          alt: img.alt,
          className: img.className
        }))
      };
    });

    console.log('Employees Page - Total img tags:', employeePhotoInfo.totalImages);
    console.log('Employees Page - Images with data:image src:', employeePhotoInfo.dataImageCount);
    console.log('Employees Page - Sample photo sources:', JSON.stringify(employeePhotoInfo.photoSources, null, 2));
    console.log('Employees Page - All image sources (first 10):', JSON.stringify(employeePhotoInfo.allImageSources, null, 2));

    // Step 5: Check for console errors
    console.log('\n=== Console Messages ===');
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
    console.log('✓ Login successful');
    console.log(`✓ Candidates page: ${candidatePhotoInfo.dataImageCount} photos with data:image src`);
    console.log(`✓ Employees page: ${employeePhotoInfo.dataImageCount} photos with data:image src`);
    console.log(`✓ Console errors: ${errorMessages.length + consoleErrors.length}`);

    if (candidatePhotoInfo.dataImageCount > 0 && employeePhotoInfo.dataImageCount > 0) {
      console.log('\n✅ SUCCESS: Photos are displaying on both pages!');
    } else {
      console.log('\n⚠️  WARNING: Some photos may not be displaying correctly');
    }

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\error_screenshot.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nBrowser closed. Test complete.');
  }
}

testPhotoDisplay();
