const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let token = null;

  // Intercept API responses
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const body = await response.json();
        apiResponses.push({
          url,
          status: response.status(),
          data: body
        });
      } catch (e) {
        // Ignore non-JSON responses
      }
    }
  });

  console.log('========================================');
  console.log('API PHOTO DATA INSPECTION');
  console.log('========================================\n');

  // STEP 1: LOGIN
  console.log('🔐 Logging in...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"], input[type="text"]', 'admin');
  await page.fill('input[name="password"], input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Extract token from localStorage
  token = await page.evaluate(() => localStorage.getItem('token'));
  console.log('  ✓ Login successful\n');

  // STEP 2: TEST CANDIDATES API
  console.log('📋 Testing Candidates API...');
  apiResponses.length = 0;
  await page.goto('http://localhost:3000/candidates', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const candidatesResponse = apiResponses.find(r =>
    r.url.includes('/api/candidates') &&
    r.status === 200 &&
    Array.isArray(r.data)
  );

  if (candidatesResponse && candidatesResponse.data.length > 0) {
    const firstCandidate = candidatesResponse.data[0];
    console.log('  First Candidate Data:');
    console.log(`    ID: ${firstCandidate.id}`);
    console.log(`    Name: ${firstCandidate.full_name_kanji || firstCandidate.full_name_roman || 'N/A'}`);
    console.log(`    photo_url: ${firstCandidate.photo_url || 'NULL'}`);
    console.log(`    photo_data_url exists: ${!!firstCandidate.photo_data_url}`);
    console.log(`    photo_data_url length: ${firstCandidate.photo_data_url?.length || 0}`);
    console.log(`    photo_data_url prefix: ${firstCandidate.photo_data_url?.substring(0, 50) || 'N/A'}...`);

    // Check if it's a valid data URI
    if (firstCandidate.photo_data_url) {
      const isValidDataURI = firstCandidate.photo_data_url.startsWith('data:image/');
      console.log(`    Is valid data URI: ${isValidDataURI}`);
    }
  } else {
    console.log('  ✗ No candidates data found in API response');
  }

  // STEP 3: TEST EMPLOYEES API
  console.log('\n👥 Testing Employees API...');
  apiResponses.length = 0;
  await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const employeesResponse = apiResponses.find(r =>
    r.url.includes('/api/employees') &&
    r.status === 200 &&
    Array.isArray(r.data)
  );

  if (employeesResponse && employeesResponse.data.length > 0) {
    // Find first employee with photo
    const employeeWithPhoto = employeesResponse.data.find(e => e.photo_data_url);

    if (employeeWithPhoto) {
      console.log('  First Employee with Photo:');
      console.log(`    ID: ${employeeWithPhoto.id}`);
      console.log(`    Name: ${employeeWithPhoto.full_name_kanji || 'N/A'}`);
      console.log(`    photo_url: ${employeeWithPhoto.photo_url || 'NULL'}`);
      console.log(`    photo_data_url exists: ${!!employeeWithPhoto.photo_data_url}`);
      console.log(`    photo_data_url length: ${employeeWithPhoto.photo_data_url?.length || 0}`);
      console.log(`    photo_data_url prefix: ${employeeWithPhoto.photo_data_url?.substring(0, 50) || 'N/A'}...`);

      // Check if it's a valid data URI
      if (employeeWithPhoto.photo_data_url) {
        const isValidDataURI = employeeWithPhoto.photo_data_url.startsWith('data:image/');
        console.log(`    Is valid data URI: ${isValidDataURI}`);
      }
    } else {
      console.log('  ⚠ No employees with photo_data_url found in API response');
      console.log(`  Total employees returned: ${employeesResponse.data.length}`);
    }
  } else {
    console.log('  ✗ No employees data found in API response');
  }

  // STEP 4: DIRECT API CALL
  console.log('\n🔧 Making direct API calls...');

  // Candidates
  const candidatesApiUrl = 'http://localhost:8000/api/candidates/?page=1&page_size=2';
  const candidatesApiResponse = await fetch(candidatesApiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const candidatesApiData = await candidatesApiResponse.json();

  if (candidatesApiData && candidatesApiData.length > 0) {
    const first = candidatesApiData[0];
    console.log('\n  Direct Candidates API Call:');
    console.log(`    ID: ${first.id}`);
    console.log(`    photo_url: ${first.photo_url || 'NULL'}`);
    console.log(`    photo_data_url exists: ${!!first.photo_data_url}`);
    console.log(`    photo_data_url length: ${first.photo_data_url?.length || 0}`);
    console.log(`    photo_data_url starts with: ${first.photo_data_url?.substring(0, 30) || 'N/A'}`);
  }

  // Employees
  const employeesApiUrl = 'http://localhost:8000/api/employees/?page=1&page_size=50';
  const employeesApiResponse = await fetch(employeesApiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const employeesApiData = await employeesApiResponse.json();

  if (employeesApiData && employeesApiData.length > 0) {
    const withPhoto = employeesApiData.find(e => e.photo_data_url);
    if (withPhoto) {
      console.log('\n  Direct Employees API Call (first with photo):');
      console.log(`    ID: ${withPhoto.id}`);
      console.log(`    Name: ${withPhoto.full_name_kanji}`);
      console.log(`    photo_url: ${withPhoto.photo_url || 'NULL'}`);
      console.log(`    photo_data_url exists: ${!!withPhoto.photo_data_url}`);
      console.log(`    photo_data_url length: ${withPhoto.photo_data_url?.length || 0}`);
      console.log(`    photo_data_url starts with: ${withPhoto.photo_data_url?.substring(0, 30) || 'N/A'}`);
    } else {
      console.log('\n  Direct Employees API Call:');
      console.log(`    ⚠ No employees with photo_data_url in first ${employeesApiData.length} records`);
    }
  }

  console.log('\n========================================');
  console.log('DIAGNOSIS COMPLETE');
  console.log('========================================');
  console.log('\nBrowser will stay open for 20 seconds...');
  await page.waitForTimeout(20000);

  await browser.close();
})();
