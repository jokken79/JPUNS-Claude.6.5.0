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
      return await response.json();
    });

    console.log('=== EMPLOYEE ID 2 API RESPONSE ===');
    console.log('Name:', emp2Data.full_name_kanji);
    console.log('Has photo_url:', emp2Data.hasOwnProperty('photo_url'));
    console.log('Has photo_data_url:', emp2Data.hasOwnProperty('photo_data_url'));
    console.log('photo_url value:', emp2Data.photo_url);
    console.log('photo_data_url value:', emp2Data.photo_data_url ? emp2Data.photo_data_url.substring(0, 80) : 'NULL');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
