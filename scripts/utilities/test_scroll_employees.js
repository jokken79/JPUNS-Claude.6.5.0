const { chromium } = require('playwright');

async function testScrollEmployees() {
  console.log('Testing employees page with scrolling...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Navigate to employees
    console.log('Navigating to employees page...');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Scroll down to see table
    console.log('Scrolling to table...');
    await page.evaluate(() => {
      window.scrollTo(0, 600);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\06_employees_scrolled.png', fullPage: true });
    console.log('Screenshot saved: 06_employees_scrolled.png');

    // Check if photo column is visible
    const photoColumnVisible = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return { error: 'No table found' };

      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
      const rows = table.querySelectorAll('tbody tr');
      const firstRow = rows[0];

      if (!firstRow) return { error: 'No rows in table' };

      const cells = Array.from(firstRow.querySelectorAll('td'));

      return {
        headers: headers,
        firstRowCells: cells.length,
        firstCellHTML: cells[0] ? cells[0].innerHTML.substring(0, 200) : 'N/A',
        hasPhotos: cells[0] ? cells[0].querySelector('img[src^="data:image"]') !== null : false
      };
    });

    console.log('Photo column analysis:', JSON.stringify(photoColumnVisible, null, 2));

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'D:\\UNS-ClaudeJP-5.4.1\\test_screenshots\\error_scroll.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testScrollEmployees();
