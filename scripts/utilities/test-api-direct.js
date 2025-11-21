const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Testing API response directly...');

  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Logged in');

    // Step 2: Navigate to employees page and wait
    console.log('\n🚀 Navigating to employees page...');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Step 3: Inject script to inspect employee data in page
    const employeeData = await page.evaluate(() => {
      // Try to access React's internal state or data
      // This will look for employee data in the window or DOM

      // Check if there's any employee data in the window object
      const results = {
        foundData: false,
        sampleEmployees: [],
        photoStats: { withPhoto: 0, withoutPhoto: 0 }
      };

      // Try to find table rows and extract employee data
      const rows = document.querySelectorAll('table tbody tr');
      console.log(`Found ${rows.length} table rows`);

      results.totalRows = rows.length;
      results.foundData = rows.length > 0;

      return results;
    });

    console.log('📋 Page data:', JSON.stringify(employeeData, null, 2));

    // Step 4: Make direct API call using page context
    console.log('\n📡 Making direct API call...');

    const apiResponse = await page.evaluate(async () => {
      // Get token from cookie
      const cookies = document.cookie.split(';').map(c => c.trim());
      console.log('Available cookies:', cookies);

      const tokenCookie = cookies.find(c => c.startsWith('auth-token='));
      const token = tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null;

      if (!token) {
        return { error: 'No token found in cookies', availableCookies: cookies };
      }

      try {
        const response = await fetch('http://localhost:8000/api/employees/?page=1&page_size=20', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return { error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        return {
          success: true,
          total: data.total,
          itemCount: data.items?.length || 0,
          firstEmployee: data.items?.[0] || null,
          photoStats: {
            withPhotoUrl: data.items?.filter(e => e.photo_url).length || 0,
            withPhotoDataUrl: data.items?.filter(e => e.photo_data_url).length || 0,
            withEither: data.items?.filter(e => e.photo_url || e.photo_data_url).length || 0
          },
          sampleEmployees: data.items?.slice(0, 5).map(e => ({
            id: e.id,
            name: e.full_name_kanji,
            hasPhotoUrl: !!e.photo_url,
            hasPhotoDataUrl: !!e.photo_data_url,
            photoDataUrlPreview: e.photo_data_url ? e.photo_data_url.substring(0, 50) : null
          })) || []
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (apiResponse.error) {
      console.log(`\n❌ API Error: ${apiResponse.error}`);
    } else if (apiResponse.success) {
      console.log('\n✅ API Response received successfully!');
      console.log(`📊 Total employees: ${apiResponse.total}`);
      console.log(`📊 Items in response: ${apiResponse.itemCount}`);

      console.log('\n📊 Photo statistics:');
      console.log(`  - With photo_url: ${apiResponse.photoStats.withPhotoUrl}`);
      console.log(`  - With photo_data_url: ${apiResponse.photoStats.withPhotoDataUrl}`);
      console.log(`  - With either photo: ${apiResponse.photoStats.withEither}`);
      console.log(`  - Photo percentage: ${((apiResponse.photoStats.withEither / apiResponse.itemCount) * 100).toFixed(1)}%`);

      console.log('\n📋 First employee:');
      if (apiResponse.firstEmployee) {
        console.log(`  - ID: ${apiResponse.firstEmployee.id}`);
        console.log(`  - Name: ${apiResponse.firstEmployee.full_name_kanji}`);
        console.log(`  - photo_url: ${apiResponse.firstEmployee.photo_url || 'NULL'}`);
        console.log(`  - photo_data_url: ${apiResponse.firstEmployee.photo_data_url ? 'EXISTS' : 'NULL'}`);
      }

      console.log('\n📋 Sample employees (first 5):');
      apiResponse.sampleEmployees.forEach((emp, i) => {
        const photoStatus = emp.hasPhotoUrl || emp.hasPhotoDataUrl ? '✅' : '❌';
        console.log(`  ${i + 1}. ${emp.name} - Photo: ${photoStatus} (url:${emp.hasPhotoUrl}, data:${emp.hasPhotoDataUrl})`);
      });

      // Final verdict
      console.log('\n' + '='.repeat(60));
      console.log('📊 FINAL VERDICT');
      console.log('='.repeat(60));
      if (apiResponse.photoStats.withEither === 0) {
        console.log('❌ PROBLEM: API returns NO photos at all!');
        console.log('   Backend is not populating photo fields');
      } else if (apiResponse.photoStats.withEither < apiResponse.itemCount * 0.5) {
        console.log(`⚠️  PARTIAL: Only ${apiResponse.photoStats.withEither}/${apiResponse.itemCount} employees have photos`);
        console.log('   Expected ~86% based on database stats');
      } else {
        console.log(`✅ SUCCESS: ${apiResponse.photoStats.withEither}/${apiResponse.itemCount} employees have photos`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
