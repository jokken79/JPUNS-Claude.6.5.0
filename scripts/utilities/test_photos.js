const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  let apiResponses = [];
  page.on('response', async (response) => {
    if (response.url().includes('/api/employees')) {
      try {
        const body = await response.json();
        apiResponses.push({ url: response.url(), status: response.status(), body: body });
      } catch (e) {}
    }
  });

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('Navigating to employees...');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('\n=== API RESPONSE CHECK ===');
    if (apiResponses.length > 0 && apiResponses[0].body && apiResponses[0].body.items) {
      const firstItem = apiResponses[0].body.items[0];
      console.log('Total API items:', apiResponses[0].body.items.length);
      console.log('First item name:', firstItem.full_name_kanji);
      console.log('Has photo_url field:', firstItem.hasOwnProperty('photo_url'));
      console.log('Has photo_data_url field:', firstItem.hasOwnProperty('photo_data_url'));
      console.log('photo_url value:', firstItem.photo_url || 'NULL');
      console.log('photo_data_url:', firstItem.photo_data_url ? firstItem.photo_data_url.substring(0, 50) + '...' : 'NULL');
    }

    await page.screenshot({ path: 'D:/UNS-ClaudeJP-5.4.1/employees_test.png', fullPage: true });

    const stats = await page.evaluate(() => ({
      totalRows: document.querySelectorAll('table tbody tr').length,
      withPhotos: document.querySelectorAll('table tbody tr img[src*="data:image"]').length,
      withIcons: document.querySelectorAll('table tbody tr svg.lucide-user-circle').length
    }));

    console.log('\n=== DISPLAY STATS ===');
    console.log('Total rows:', stats.totalRows);
    console.log('With photos:', stats.withPhotos);
    console.log('With icons:', stats.withIcons);
    console.log('Photo rate:', ((stats.withPhotos / stats.totalRows) * 100).toFixed(1) + '%');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
