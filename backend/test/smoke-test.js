'use strict';

const http = require('http');
const createApp = require('../src/app');

const app = createApp();
const server = app.listen(0, runTests);

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const data = body ? JSON.stringify(body) : null;
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
  console.log('=== Health check ===');
  const health = await request('GET', '/health');
  check('GET /health returns 200', health.status === 200, health.body);

  console.log('\n=== GET /orders ===');
  const all = await request('GET', '/orders');
  check('returns 200', all.status === 200);
  check('returns 10 seed orders', all.body.count === 10, all.body.count);

  console.log('\n=== GET /orders?sellerType=PRODUCER ===');
  const producers = await request('GET', '/orders?sellerType=PRODUCER');
  check('filters by sellerType', producers.body.data.every((o) => o.sellerType === 'PRODUCER'), producers.body);

  console.log('\n=== GET /orders?orderType=RESTOCK_ORDER ===');
  const restocks = await request('GET', '/orders?orderType=RESTOCK_ORDER');
  check('filters by orderType', restocks.body.data.every((o) => o.orderType === 'RESTOCK_ORDER'), restocks.body);
  check('finds 3 restock orders', restocks.body.count === 3, restocks.body.count);

  console.log('\n=== GET /orders/ord-0001 ===');
  const single = await request('GET', '/orders/ord-0001');
  check('returns 200', single.status === 200);
  check('returns correct id', single.body.data.id === 'ord-0001');

  console.log('\n=== GET /orders/nonexistent ===');
  const missing = await request('GET', '/orders/nonexistent');
  check('returns 404', missing.status === 404, missing.body);
  check('error code is NOT_FOUND', missing.body.error.code === 'NOT_FOUND');

  console.log('\n=== POST /orders (valid DIRECT customer order) ===');
  const createDirect = await request('POST', '/orders', {
    orderType: 'CUSTOMER_ORDER',
    buyerId: 'cust-999',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'prod-201',
    items: [{ productId: 'prd-aata-5kg', batchId: 'batch-test-01', title: 'Wheat Flour 5kg', qty: 2, unitPrice: 220 }],
    channel: 'APP',
    fulfillmentMode: 'DELIVERY',
  });
  check('returns 201', createDirect.status === 201, createDirect.body);
  check('status defaults to PLACED', createDirect.body.data.status === 'PLACED');
  check('total auto-calculated', createDirect.body.data.total === 440, createDirect.body.data.total);
  const newOrderId = createDirect.body.data.id;

  console.log('\n=== POST /orders (valid RESELLER restock order) ===');
  const createRestock = await request('POST', '/orders', {
    orderType: 'RESTOCK_ORDER',
    buyerId: 'store-301',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'prod-201',
    items: [{ productId: 'prd-rice-10kg', batchId: 'batch-test-02', title: 'Basmati Rice 10kg', qty: 10, unitPrice: 900 }],
    channel: 'WHATSAPP',
    fulfillmentMode: 'PICKUP',
  });
  check('returns 201', createRestock.status === 201, createRestock.body);

  console.log('\n=== POST /orders (missing batchId -> validation error) ===');
  const badItem = await request('POST', '/orders', {
    orderType: 'CUSTOMER_ORDER',
    buyerId: 'cust-999',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'prod-201',
    items: [{ productId: 'prd-aata-5kg', title: 'Wheat Flour 5kg', qty: 2, unitPrice: 220 }],
    channel: 'APP',
    fulfillmentMode: 'DELIVERY',
  });
  check('returns 400', badItem.status === 400, badItem.body);
  check('error code is VALIDATION_ERROR', badItem.body.error.code === 'VALIDATION_ERROR');

  console.log('\n=== POST /orders (qty = 0 -> validation error) ===');
  const badQty = await request('POST', '/orders', {
    orderType: 'CUSTOMER_ORDER',
    buyerId: 'cust-999',
    sellerType: 'LOCAL_STORE',
    fulfillingSellerId: 'store-301',
    items: [{ productId: 'prd-aata-5kg', batchId: 'b1', title: 'Wheat Flour 5kg', qty: 0, unitPrice: 220 }],
    channel: 'APP',
    fulfillmentMode: 'DELIVERY',
  });
  check('returns 400', badQty.status === 400, badQty.body);

  console.log('\n=== POST /orders (invalid sellerType enum -> validation error) ===');
  const badEnum = await request('POST', '/orders', {
    orderType: 'CUSTOMER_ORDER',
    buyerId: 'cust-999',
    sellerType: 'WAREHOUSE',
    fulfillingSellerId: 'store-301',
    items: [{ productId: 'p', batchId: 'b', title: 't', qty: 1, unitPrice: 1 }],
    channel: 'APP',
    fulfillmentMode: 'DELIVERY',
  });
  check('returns 400 for invalid enum', badEnum.status === 400, badEnum.body);

  console.log('\n=== PATCH /orders/:id/status (valid transition PLACED -> CONFIRMED) ===');
  const validTransition = await request('PATCH', `/orders/${newOrderId}/status`, { status: 'CONFIRMED' });
  check('returns 200', validTransition.status === 200, validTransition.body);
  check('status updated', validTransition.body.data.status === 'CONFIRMED');

  console.log('\n=== PATCH /orders/:id/status (invalid transition PLACED -> FULFILLED, on a fresh order) ===');
  const invalidTransition = await request('PATCH', `/orders/ord-0001/status`, { status: 'FULFILLED' });
  check('returns 409', invalidTransition.status === 409, invalidTransition.body);
  check('error code is INVALID_TRANSITION', invalidTransition.body.error.code === 'INVALID_TRANSITION');

  console.log('\n=== PATCH /orders/:id/status (COMPLETED -> PLACED forbidden) ===');
  const completedBack = await request('PATCH', '/orders/ord-0005/status', { status: 'PLACED' });
  check('returns 409', completedBack.status === 409, completedBack.body);

  console.log('\n=== PATCH /orders/:id/status (CANCELLED -> anything forbidden) ===');
  const cancelledForward = await request('PATCH', '/orders/ord-0006/status', { status: 'CONFIRMED' });
  check('returns 409', cancelledForward.status === 409, cancelledForward.body);

  console.log('\n=== PATCH /orders/:id/cancel (PLACED -> CANCELLED via dedicated endpoint) ===');
  const cancelResult = await request('PATCH', `/orders/${createRestock.body.data.id}/cancel`, {});
  check('returns 200', cancelResult.status === 200, cancelResult.body);
  check('status is CANCELLED', cancelResult.body.data.status === 'CANCELLED');

  console.log('\n=== PATCH /orders/:id/cancel (cancelling an already-cancelled order fails) ===');
  const doubleCancel = await request('PATCH', `/orders/${createRestock.body.data.id}/cancel`, {});
  check('returns 409', doubleCancel.status === 409, doubleCancel.body);

  console.log('\n=== Full happy-path lifecycle walk ===');
  const lifecycleOrder = await request('POST', '/orders', {
    orderType: 'CUSTOMER_ORDER',
    buyerId: 'cust-555',
    sellerType: 'LOCAL_STORE',
    fulfillingSellerId: 'store-301',
    items: [{ productId: 'prd-sugar-1kg', batchId: 'batch-lc-01', title: 'Sugar 1kg', qty: 1, unitPrice: 48 }],
    channel: 'APP',
    fulfillmentMode: 'PICKUP',
  });
  const lcId = lifecycleOrder.body.data.id;
  const steps = ['CONFIRMED', 'PACKED', 'FULFILLED', 'COMPLETED'];
  let lifecycleOk = true;
  for (const step of steps) {
    const r = await request('PATCH', `/orders/${lcId}/status`, { status: step });
    if (r.status !== 200 || r.body.data.status !== step) {
      lifecycleOk = false;
      console.log('    step failed at', step, r.body);
    }
  }
  check('full PLACED->CONFIRMED->PACKED->FULFILLED->COMPLETED walk succeeds', lifecycleOk);

  console.log('\n=== DELETE is not implemented (cancelled orders remain) ===');
  const cancelledStillThere = await request('GET', `/orders/${createRestock.body.data.id}`);
  check('cancelled order still retrievable', cancelledStillThere.status === 200 && cancelledStillThere.body.data.status === 'CANCELLED');

  console.log(`\n\nRESULTS: ${passed} passed, ${failed} failed`);
  server.close(() => process.exit(failed > 0 ? 1 : 0));
}
