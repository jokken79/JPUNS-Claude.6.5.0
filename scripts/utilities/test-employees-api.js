// Simple test to check employees API and frontend errors
const https = require('http');

async function testAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/employees/?page=1&page_size=5',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('Testing /api/employees/ endpoint...\n');
    const response = await testAPI();

    console.log('=== API RESPONSE ===');
    console.log(`Total employees: ${response.total}`);
    console.log(`Items returned: ${response.items?.length || 0}`);
    console.log(`Page: ${response.page}/${response.total_pages}`);

    if (response.items && response.items.length > 0) {
      console.log('\n=== FIRST EMPLOYEE DATA ===');
      const first = response.items[0];
      console.log(`ID: ${first.id}`);
      console.log(`Name: ${first.full_name_kanji}`);
      console.log(`Hakenmoto ID: ${first.hakenmoto_id}`);
      console.log(`Factory ID: ${first.factory_id}`);
      console.log(`Factory Name: ${first.factory_name}`);
      console.log(`Photo URL: ${first.photo_url || 'NULL'}`);
      console.log(`Photo Data URL: ${first.photo_data_url ? 'EXISTS (base64)' : 'NULL'}`);
      console.log(`Photo Data URL length: ${first.photo_data_url?.length || 0} chars`);

      console.log('\n=== PHOTO FIELDS IN ALL ITEMS ===');
      response.items.forEach((emp, idx) => {
        const hasPhotoUrl = !!emp.photo_url;
        const hasPhotoData = !!emp.photo_data_url;
        console.log(`Employee ${idx + 1} (${emp.full_name_kanji}): photo_url=${hasPhotoUrl}, photo_data_url=${hasPhotoData}`);
      });

      console.log('\n=== SAMPLE EMPLOYEE OBJECT KEYS ===');
      console.log(Object.keys(first).join(', '));
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error);
  }
}

main();
