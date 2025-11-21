const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Testing frontend employee data...');

  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ Logged in');

    // Step 2: Navigate to employees page
    console.log('\n🚀 Navigating to employees page...');
    await page.goto('http://localhost:3000/employees', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('table', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Step 3: Inject script to inspect React component state
    const componentData = await page.evaluate(() => {
      // Try to find the React component instance or its data
      // Check if window.__REACT_DEVTOOLS_GLOBAL_HOOK__ exists
      const results = {
        foundReactDevtools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        tableRows: 0,
        employeeDataSample: []
      };

      // Count table rows
      const rows = document.querySelectorAll('table tbody tr');
      results.tableRows = rows.length;

      // Try to extract employee data from DOM
      const firstRows = Array.from(rows).slice(0, 10);
      firstRows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          const photoCell = cells[0]; // First column is photo
          const nameCell = cells[5]; // 6th column is name (氏名)

          const hasImg = !!photoCell.querySelector('img');
          const hasPlaceholder = !!photoCell.querySelector('svg');

          results.employeeDataSample.push({
            rowIndex: index,
            name: nameCell ? nameCell.textContent.trim() : 'N/A',
            hasImg: hasImg,
            hasPlaceholder: hasPlaceholder,
            imgSrc: hasImg ? photoCell.querySelector('img').src.substring(0, 50) : null
          });
        }
      });

      return results;
    });

    console.log('\n📋 Frontend component analysis:');
    console.log(`Table rows: ${componentData.tableRows}`);
    console.log(`React DevTools available: ${componentData.foundReactDevtools}`);

    console.log('\n📋 First 10 employees in DOM:');
    componentData.employeeDataSample.forEach(emp => {
      const status = emp.hasImg ? '🖼️ IMG' : (emp.hasPlaceholder ? '👤 PLACEHOLDER' : '❓');
      console.log(`  ${emp.rowIndex + 1}. ${emp.name} - ${status}`);
      if (emp.hasImg) {
        console.log(`     src: ${emp.imgSrc}...`);
      }
    });

    // Step 4: Add console listener to catch any React Query data
    console.log('\n📡 Listening for React Query cache data...');

    const reactQueryData = await page.evaluate(() => {
      // Try to access React Query cache if available
      // This is a hack - React Query stores data in memory

      // Alternative: Look for __react_query__ in window
      const queryKeys = Object.keys(window).filter(k => k.includes('query') || k.includes('Query'));

      return {
        foundQueryKeys: queryKeys,
        windowKeys: Object.keys(window).filter(k => k.startsWith('__')).slice(0, 20)
      };
    });

    console.log('\n📋 React Query analysis:');
    console.log(`Found query-related keys: ${reactQueryData.foundQueryKeys.length}`);
    if (reactQueryData.foundQueryKeys.length > 0) {
      console.log(`Keys: ${reactQueryData.foundQueryKeys.slice(0, 5).join(', ')}`);
    }

    // Step 5: Take screenshot
    await page.screenshot({
      path: 'D:\\UNS-ClaudeJP-5.4.1\\frontend-employee-data.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved');

    // Final analysis
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS SUMMARY');
    console.log('='.repeat(60));

    const imgCount = componentData.employeeDataSample.filter(e => e.hasImg).length;
    const placeholderCount = componentData.employeeDataSample.filter(e => e.hasPlaceholder).length;

    console.log(`Rows displayed: ${componentData.tableRows}`);
    console.log(`With IMG tags: ${imgCount}/${componentData.employeeDataSample.length}`);
    console.log(`With placeholders: ${placeholderCount}/${componentData.employeeDataSample.length}`);

    if (imgCount === 0 && placeholderCount > 0) {
      console.log('\n❌ PROBLEM CONFIRMED:');
      console.log('   - Backend returns photo_data_url for 50% of employees');
      console.log('   - Frontend renders 0% with <img> tags');
      console.log('   - Frontend renders 100% with placeholder SVG');
      console.log('\n🔍 LIKELY CAUSE:');
      console.log('   The employee objects in React component state are');
      console.log('   missing photo_url and photo_data_url fields.');
      console.log('\n💡 CHECK:');
      console.log('   1. employeeService.getEmployees() response transformation');
      console.log('   2. React Query data processing');
      console.log('   3. TypeScript Employee interface field mapping');
    } else if (imgCount > 0) {
      console.log('\n✅ Photos ARE being rendered!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
})();
