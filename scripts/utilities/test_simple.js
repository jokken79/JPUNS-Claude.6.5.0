const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);

    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    const result = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/employees/2', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      return {
        status: response.status,
        data: await response.json()
      };
    });

    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error(error.message);
  } finally {
    await browser.close();
  }
})();
