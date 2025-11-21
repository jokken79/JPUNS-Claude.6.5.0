const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Testing API response for photo fields...');

  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Logged in');

    // Step 2: Intercept API response
    console.log('🔍 Intercepting API calls...');

    let apiResponse = null;
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/employees') && !url.includes('/api/employees/')) {
        try {
          const json = await response.json();
          apiResponse = json;
          console.log(`\n📡 API Response received from: ${url}`);
          console.log(`📊 Total employees: ${json.total}`);
          console.log(`📊 Items in response: ${json.items?.length}`);

          if (json.items && json.items.length > 0) {
            const firstEmployee = json.items[0];
            console.log('\n📋 First employee data:');
            console.log(`  - ID: ${firstEmployee.id}`);
            console.log(`  - Name: ${firstEmployee.full_name_kanji}`);
            console.log(`  - photo_url: ${firstEmployee.photo_url ? 'EXISTS' : 'NULL/UNDEFINED'}`);
            console.log(`  - photo_data_url: ${firstEmployee.photo_data_url ? `EXISTS (${firstEmployee.photo_data_url.substring(0, 50)}...)` : 'NULL/UNDEFINED'}`);

            // Count employees with photos
            const withPhotoUrl = json.items.filter(e => e.photo_url).length;
            const withPhotoDataUrl = json.items.filter(e => e.photo_data_url).length;
            const withEitherPhoto = json.items.filter(e => e.photo_url || e.photo_data_url).length;

            console.log(`\n📊 Photo statistics (first ${json.items.length} employees):`);
            console.log(`  - With photo_url: ${withPhotoUrl}`);
            console.log(`  - With photo_data_url: ${withPhotoDataUrl}`);
            console.log(`  - With either photo: ${withEitherPhoto}`);
            console.log(`  - Photo percentage: ${((withEitherPhoto / json.items.length) * 100).toFixed(1)}%`);

            // Sample a few employees with and without photos
            console.log('\n📋 Sample employees:');
            json.items.slice(0, 5).forEach((emp, i) => {
              const hasPhoto = emp.photo_url || emp.photo_data_url;
              console.log(`  ${i + 1}. ${emp.full_name_kanji} - Photo: ${hasPhoto ? '✅' : '❌'}`);
            });
          }
        } catch (e) {
          console.log(`⚠️  Could not parse response: ${e.message}`);
        }
      }
    });

    // Step 3: Navigate to employees page
    console.log('\n🚀 Navigating to employees page...');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for API response to be intercepted
    await page.waitForTimeout(3000);

    if (!apiResponse) {
      console.log('\n❌ No API response was intercepted!');
    } else {
      console.log('\n✅ API response analysis complete');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
