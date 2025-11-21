const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Starting employee photo test...');

  try {
    // Step 1: Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Fill login form
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    console.log('✅ Login submitted, waiting for navigation...');

    // Wait for navigation after login
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Logged in successfully');

    // Step 2: Navigate to employees page
    console.log('🚀 Navigating to employees page...');
    await page.goto('http://localhost:3000/employees', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✅ Page loaded');

    // Wait for the table to be visible
    await page.waitForSelector('table', { timeout: 30000 });
    console.log('✅ Table found');

    // Scroll down to make table visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);

    // Wait a bit for images to load
    await page.waitForTimeout(3000);

    // Take screenshot after scrolling
    await page.screenshot({
      path: 'D:\\UNS-ClaudeJP-5.4.1\\employees-page-table.png',
      fullPage: false
    });
    console.log('📸 Table screenshot saved to employees-page-table.png');

    // Get detailed HTML structure of first row
    const firstRowHTML = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      return firstRow ? firstRow.innerHTML : 'No row found';
    });
    console.log('\n📋 First row HTML structure:');
    console.log(firstRowHTML.substring(0, 500) + '...');

    // Check for photo column
    const photoColumnInfo = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('table thead th')).map(th => th.textContent.trim());
      const firstRow = document.querySelector('table tbody tr');
      const cells = firstRow ? Array.from(firstRow.querySelectorAll('td')).map((td, i) => ({
        index: i,
        header: headers[i],
        hasImg: !!td.querySelector('img'),
        html: td.innerHTML.substring(0, 100)
      })) : [];

      return { headers, cells };
    });

    console.log('\n📋 Table headers:', photoColumnInfo.headers);
    console.log('\n📋 First row cells:');
    photoColumnInfo.cells.forEach(cell => {
      console.log(`  Column ${cell.index} (${cell.header}): hasImg=${cell.hasImg}, html=${cell.html}`);
    });

    // Count photos with data:image URLs
    const dataImageCount = await page.locator('img[src*="data:image"]').count();
    console.log(`\n📊 Photos with data:image URLs: ${dataImageCount}`);

    // Count all img tags in the table
    const allImagesCount = await page.locator('table img').count();
    console.log(`📊 Total img tags in table: ${allImagesCount}`);

    // Get visible rows count
    const rowsCount = await page.locator('table tbody tr').count();
    console.log(`📊 Visible table rows: ${rowsCount}`);

    // Check for any images with src attribute
    const anyImageInfo = await page.evaluate(() => {
      const allImages = Array.from(document.querySelectorAll('table img'));
      return allImages.map((img, i) => ({
        index: i,
        hasSrc: !!img.src,
        srcPreview: img.src ? img.src.substring(0, 50) : 'no src',
        srcType: img.src ? (
          img.src.startsWith('data:image') ? 'data:image' :
          img.src.startsWith('http') ? 'http' :
          img.src.includes('placeholder') ? 'placeholder' : 'other'
        ) : 'none',
        alt: img.alt,
        className: img.className
      })).slice(0, 5); // First 5 images only
    });

    console.log('\n📋 First 5 images info:');
    anyImageInfo.forEach(info => {
      console.log(JSON.stringify(info, null, 2));
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total rows visible: ${rowsCount}`);
    console.log(`Photos with data:image: ${dataImageCount}`);
    console.log(`Total images in table: ${allImagesCount}`);

    if (rowsCount > 0) {
      const photoPercentage = ((dataImageCount / rowsCount) * 100).toFixed(1);
      console.log(`Photo display rate: ${photoPercentage}%`);
    }

    if (dataImageCount > 0) {
      console.log('\n✅ SUCCESS: Photos ARE displaying!');
    } else if (allImagesCount > 0) {
      console.log('\n⚠️  PARTIAL: Images found but not with data:image URLs');
    } else {
      console.log('\n❌ ISSUE: No images in table at all');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\error-screenshot.png' });
    console.log('📸 Error screenshot saved to error-screenshot.png');
  } finally {
    // Keep browser open for 15 seconds for manual inspection
    console.log('\n⏰ Keeping browser open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);

    await browser.close();
  }
})();
