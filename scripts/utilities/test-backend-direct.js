const { chromium } = require('playwright');
const https = require('http');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Testing backend API directly...');

  try {
    // Step 1: Login via UI
    console.log('🔐 Logging in via UI...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Logged in via UI');

    // Step 2: Get cookies from browser context
    const cookies = await context.cookies();
    console.log(`\n📋 Found ${cookies.length} cookies`);

    const authCookie = cookies.find(c => c.name === 'uns-auth-token');
    if (!authCookie) {
      console.log('❌ No uns-auth-token cookie found!');
      console.log('Available cookies:', cookies.map(c => c.name).join(', '));
      return;
    }

    const token = authCookie.value;
    console.log(`✅ Got auth token: ${token.substring(0, 20)}...`);

    // Step 3: Make direct API request to backend
    console.log('\n📡 Making direct API request to backend...');

    const apiResponse = await page.request.get('http://localhost:8000/api/employees/?page=1&page_size=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!apiResponse.ok()) {
      console.log(`❌ API Error: HTTP ${apiResponse.status()}`);
      const text = await apiResponse.text();
      console.log('Response:', text.substring(0, 200));
      return;
    }

    const data = await apiResponse.json();

    console.log('\n✅ API Response received successfully!');
    console.log(`📊 Total employees: ${data.total}`);
    console.log(`📊 Items in response: ${data.items?.length || 0}`);

    if (data.items && data.items.length > 0) {
      // Photo statistics
      const photoStats = {
        withPhotoUrl: data.items.filter(e => e.photo_url).length,
        withPhotoDataUrl: data.items.filter(e => e.photo_data_url).length,
        withEither: data.items.filter(e => e.photo_url || e.photo_data_url).length
      };

      console.log('\n📊 Photo statistics:');
      console.log(`  - With photo_url: ${photoStats.withPhotoUrl}`);
      console.log(`  - With photo_data_url: ${photoStats.withPhotoDataUrl}`);
      console.log(`  - With either photo: ${photoStats.withEither}`);
      console.log(`  - Photo percentage: ${((photoStats.withEither / data.items.length) * 100).toFixed(1)}%`);

      // First employee details
      const firstEmployee = data.items[0];
      console.log('\n📋 First employee details:');
      console.log(`  - ID: ${firstEmployee.id}`);
      console.log(`  - Name: ${firstEmployee.full_name_kanji}`);
      console.log(`  - photo_url: ${firstEmployee.photo_url || 'NULL'}`);
      console.log(`  - photo_data_url: ${firstEmployee.photo_data_url ? `EXISTS (length: ${firstEmployee.photo_data_url.length})` : 'NULL'}`);

      // Sample employees
      console.log('\n📋 Sample employees (first 5):');
      data.items.slice(0, 5).forEach((emp, i) => {
        const photoStatus = (emp.photo_url || emp.photo_data_url) ? '✅' : '❌';
        console.log(`  ${i + 1}. ${emp.full_name_kanji} - Photo: ${photoStatus} (url:${!!emp.photo_url}, data:${!!emp.photo_data_url})`);
      });

      // Final verdict
      console.log('\n' + '='.repeat(60));
      console.log('📊 FINAL VERDICT');
      console.log('='.repeat(60));
      if (photoStats.withEither === 0) {
        console.log('❌ PROBLEM: Backend API returns NO photos!');
        console.log('   The photo fields exist but are all NULL');
        console.log('   Database has 815 employees with photos (86.2%)');
        console.log('   → Backend is not reading photo_data_url from database');
      } else if (photoStats.withEither < data.items.length * 0.5) {
        console.log(`⚠️  PARTIAL: Only ${photoStats.withEither}/${data.items.length} have photos`);
        console.log('   Expected ~17 out of 20 (86%)');
        console.log('   → Backend returning some but not all photos');
      } else {
        console.log(`✅ SUCCESS: ${photoStats.withEither}/${data.items.length} employees have photos!`);
        console.log('   This matches the expected 86% rate');
        console.log('   → Backend is working correctly');
        console.log('   → Frontend code should display these photos');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n⏰ Closing browser...');
    await browser.close();
  }
})();
