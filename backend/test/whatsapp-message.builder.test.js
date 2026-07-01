'use strict';

const assert = require('node:assert');
const { test } = require('node:test');
const Order = require('../src/modules/order/domain/entities/order.entity');
const { buildOrderMessage, formatOrderIdForDisplay } = require('../src/modules/whatsapp/domain/builders/whatsapp-message.builder');

function makeOrder(overrides = {}) {
  return new Order({
    orderType: 'CUSTOMER_ORDER',
    buyerId: 'buy_001',
    sellerType: 'PRODUCER',
    fulfillingSellerId: 'sel_001',
    items: [{ productId: 'prd_001', batchId: 'bat_001', title: 'Wild Forest Honey', qty: 2, unitPrice: 450 }],
    channel: 'WHATSAPP',
    fulfillmentMode: 'DELIVERY',
    ...overrides,
  });
}

test('buildOrderMessage includes the item line with title and qty', () => {
  const order = makeOrder();
  const message = buildOrderMessage(order);
  assert.match(message, /Wild Forest Honey × 2/);
});

test('buildOrderMessage includes the total', () => {
  const order = makeOrder();
  const message = buildOrderMessage(order);
  assert.match(message, /Total: ₹900/);
});

test('buildOrderMessage includes the fulfillment mode', () => {
  const order = makeOrder();
  const message = buildOrderMessage(order);
  assert.match(message, /Fulfillment: DELIVERY/);
});

test('buildOrderMessage includes a human-readable short order id', () => {
  const order = makeOrder();
  const message = buildOrderMessage(order);
  assert.match(message, /Order ID: ORD-[A-F0-9]{6}/);
});

test('buildOrderMessage lists multiple items, one per line', () => {
  const order = makeOrder({
    items: [
      { productId: 'prd_001', batchId: 'bat_001', title: 'Wild Forest Honey', qty: 2, unitPrice: 450 },
      { productId: 'prd_002', batchId: 'bat_002', title: 'Organic Jaggery', qty: 1, unitPrice: 90 },
    ],
  });
  const message = buildOrderMessage(order);
  assert.match(message, /Wild Forest Honey × 2/);
  assert.match(message, /Organic Jaggery × 1/);
});

test('buildOrderMessage falls back item display name to productId when title is absent', () => {
  // Order entity itself defaults title -> productId (see order-item.entity.js),
  // so the builder never has to special-case a missing title.
  const order = makeOrder({
    items: [{ productId: 'prd_999', batchId: 'bat_999', qty: 3, unitPrice: 50 }],
  });
  const message = buildOrderMessage(order);
  assert.match(message, /prd_999 × 3/);
});

test('formatOrderIdForDisplay produces an ORD- prefixed uppercase short id', () => {
  const display = formatOrderIdForDisplay('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  assert.match(display, /^ORD-[A-F0-9]{6}$/);
});
