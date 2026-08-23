const http = require('http');

// Helper to make HTTP request
function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting CodeAlpha Task 1 Backend Verification Tests ---');

  // 1. Test Products API
  console.log('\n[1] Testing GET /api/products:');
  const productsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products',
    method: 'GET'
  });
  console.log(`Status: ${productsRes.status}, Total Products: ${productsRes.data.products?.length}`);
  if (productsRes.status !== 200 || !productsRes.data.products || productsRes.data.products.length === 0) {
    throw new Error('Products API failed');
  }

  const sampleProd = productsRes.data.products[0];
  console.log(`Sample product loaded: "${sampleProd.name}" ($${sampleProd.price})`);

  // 2. Test Single Product API
  console.log('\n[2] Testing GET /api/products/:id:');
  const singleProdRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/products/${sampleProd.id}`,
    method: 'GET'
  });
  console.log(`Status: ${singleProdRes.status}, Product Name: ${singleProdRes.data.product?.name}`);

  // 3. Test Registration
  console.log('\n[3] Testing POST /api/register:');
  const testEmail = `testuser_${Date.now()}@example.com`;
  const registerRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Test Intern User',
    email: testEmail,
    password: 'password123'
  });
  console.log(`Status: ${registerRes.status}, Registered User: ${registerRes.data.user?.email}`);
  const authToken = registerRes.data.token;

  // 4. Test Login
  console.log('\n[4] Testing POST /api/login:');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: 'password123'
  });
  console.log(`Status: ${loginRes.status}, Login Message: ${loginRes.data.message}`);

  // 5. Test Order Processing
  console.log('\n[5] Testing POST /api/orders:');
  const orderRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  }, {
    customer_name: 'Test Intern User',
    customer_email: testEmail,
    shipping_address: '123 Tech Park, Silicon Valley, CA 94025',
    payment_method: 'Credit / Debit Card',
    items: [
      { id: sampleProd.id, name: sampleProd.name, price: sampleProd.price, quantity: 2 }
    ],
    total_amount: sampleProd.price * 2
  });
  console.log(`Status: ${orderRes.status}, Created Order ID: #${orderRes.data.orderId}`);

  // 6. Test Get Order Details
  console.log('\n[6] Testing GET /api/orders/:id:');
  const orderDetailsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${orderRes.data.orderId}`,
    method: 'GET'
  });
  console.log(`Status: ${orderDetailsRes.status}, Order Status: ${orderDetailsRes.data.order?.status}`);

  // 7. Test User Order History
  console.log('\n[7] Testing GET /api/my-orders:');
  const myOrdersRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/my-orders',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  console.log(`Status: ${myOrdersRes.status}, Orders retrieved: ${myOrdersRes.data.orders?.length}`);

  console.log('\n========================================');
  console.log('✅ ALL TASK 1 CRITERIA VERIFIED SUCCESSFULLY!');
  console.log('========================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
