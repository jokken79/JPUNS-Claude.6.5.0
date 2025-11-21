const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    const emp2Data = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/employees/2', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();
      return {
        status: response.status,
        data: data
      };
    });

    console.log('=== FULL API RESPONSE ===');
    console.log('Status:', emp2Data.status);
    console.log('Response:', JSON.stringify(emp2Data.data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
