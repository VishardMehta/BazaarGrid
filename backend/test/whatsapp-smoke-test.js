'use strict';

const http = require('http');
const createApp = require('../src/app');

const app = createApp();
const server = app.listen(0, runTests);

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const data = body !== undefined ? JSON.stringify(body) : null;
    const req = http.request(
      {
        method,
        host: 'localhost',
        port,
        path,
        headers: data
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
          : {},
      },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(chunks);
          } catch {
            parsed = chunks;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function check(label, condition, extra) {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL: ${label}`, extra !== undefined ? JSON.stringify(extra) : '');
  }
}

async function runTests() {
  console.log('=== Regression: existing Task 3 routes still work ===');
  const health = await request('GET', '/health');
  check('GET /health still 200', health.status === 200);

  const listOrders = await request('GET', '/orders');
  check('GET /orders still works', listOrders.status === 200);

  console.log('\n=== POST /orders/whatsapp (valid request, spec example shape) ===');
  const validResult = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_001',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'sel_001',
    phone: '+919876543210',
    fulfillmentMode: 'DELIVERY',
    items: [{ productId: 'prd_001', batchId: 'bat_001', qty: 2, unitPrice: 450 }],
  });
  check('returns 201', validResult.status === 201, validResult.body);
  check('success: true', validResult.body.success === true);
  check('message matches spec', validResult.body.message === 'WhatsApp order created successfully');
  check('orderId is present', typeof validResult.body.orderId === 'string');
  check('whatsappUrl starts with https://wa.me/', validResult.body.whatsappUrl && validResult.body.whatsappUrl.startsWith('https://wa.me/919876543210?text='));

  console.log('\n=== The created order is retrievable via the EXISTING GET /orders/:id (same repository) ===');
  const fetched = await request('GET', `/orders/${validResult.body.orderId}`);
  check('order exists in the same store', fetched.status === 200, fetched.body);
  check('channel is WHATSAPP', fetched.body.data.channel === 'WHATSAPP');
  check('orderType defaulted to CUSTOMER_ORDER', fetched.body.data.orderType === 'CUSTOMER_ORDER');
  check('status defaults to PLACED (same Order entity default)', fetched.body.data.status === 'PLACED');
  check('total computed by the SAME entity logic (2 x 450 = 900)', fetched.body.data.total === 900);
  check('item title fell back to productId', fetched.body.data.items[0].title === 'prd_001');

  console.log('\n=== The created WhatsApp order obeys the SAME lifecycle policy as any other order ===');
  const skipAhead = await request('PATCH', `/orders/${validResult.body.orderId}/status`, { status: 'FULFILLED' });
  check('PLACED -> FULFILLED still rejected (same policy, no special-casing for WHATSAPP channel)', skipAhead.status === 409, skipAhead.body);

  console.log('\n=== POST /orders/whatsapp (missing phone -> validation error) ===');
  const missingPhone = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_002',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'sel_001',
    fulfillmentMode: 'DELIVERY',
    items: [{ productId: 'prd_001', batchId: 'bat_001', qty: 1, unitPrice: 100 }],
  });
  check('returns 400', missingPhone.status === 400, missingPhone.body);
  check('error code VALIDATION_ERROR', missingPhone.body.error.code === 'VALIDATION_ERROR');

  console.log('\n=== POST /orders/whatsapp (malformed phone -> validation error) ===');
  const badPhone = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_002',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'sel_001',
    phone: 'not-a-phone',
    fulfillmentMode: 'DELIVERY',
    items: [{ productId: 'prd_001', batchId: 'bat_001', qty: 1, unitPrice: 100 }],
  });
  check('returns 400', badPhone.status === 400, badPhone.body);

  console.log('\n=== POST /orders/whatsapp (missing batchId -> validation error, reused item schema) ===');
  const missingBatch = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_002',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'sel_001',
    phone: '+919876543210',
    fulfillmentMode: 'DELIVERY',
    items: [{ productId: 'prd_001', qty: 1, unitPrice: 100 }],
  });
  check('returns 400', missingBatch.status === 400, missingBatch.body);

  console.log('\n=== POST /orders/whatsapp (qty = 0 -> validation error, reused item schema) ===');
  const badQty = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_002',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'sel_001',
    phone: '+919876543210',
    fulfillmentMode: 'DELIVERY',
    items: [{ productId: 'prd_001', batchId: 'bat_001', qty: 0, unitPrice: 100 }],
  });
  check('returns 400', badQty.status === 400, badQty.body);

  console.log('\n=== POST /orders/whatsapp (invalid sellerType -> validation error) ===');
  const badSellerType = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_002',
    sellerType: 'WAREHOUSE',
    fulfillingSellerId: 'sel_001',
    phone: '+919876543210',
    fulfillmentMode: 'DELIVERY',
    items: [{ productId: 'prd_001', batchId: 'bat_001', qty: 1, unitPrice: 100 }],
  });
  check('returns 400', badSellerType.status === 400, badSellerType.body);

  console.log('\n=== POST /orders/whatsapp with LOCAL_STORE seller (reseller path, same as Task 3) ===');
  const storeOrder = await request('POST', '/orders/whatsapp', {
    buyerId: 'buy_003',
    sellerType: 'LOCAL_STORE',
    fulfillingSellerId: 'store-301',
    phone: '9876543210',
    fulfillmentMode: 'PICKUP',
    items: [{ productId: 'prd_002', batchId: 'bat_002', qty: 3, unitPrice: 80 }],
  });
  check('returns 201 for LOCAL_STORE seller too', storeOrder.status === 201, storeOrder.body);
  check('whatsappUrl handles phone without +', storeOrder.body.whatsappUrl.startsWith('https://wa.me/9876543210?text='));

  console.log(`\n\nRESULTS: ${passed} passed, ${failed} failed`);
  server.close(() => process.exit(failed > 0 ? 1 : 0));
}
