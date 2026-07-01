'use strict';

const assert = require('node:assert');
const { test } = require('node:test');
const Order = require('../src/modules/order/domain/entities/order.entity');

const validOrderInput = () => ({
  orderType: 'CUSTOMER_ORDER',
  buyerId: 'cust-1',
  sellerType: 'PRODUCER',
  fulfillingSellerId: 'prod-1',
  items: [{ productId: 'p1', batchId: 'b1', title: 'Item', qty: 2, unitPrice: 50 }],
  channel: 'APP',
  fulfillmentMode: 'DELIVERY',
});

test('valid order constructs successfully and auto-calculates total', () => {
  const order = new Order(validOrderInput());
  assert.strictEqual(order.total, 100);
  assert.strictEqual(order.status, 'PLACED');
  assert.ok(order.id);
});

test('order without batchId on an item throws ValidationError', () => {
  const input = validOrderInput();
  input.items = [{ productId: 'p1', title: 'Item', qty: 1, unitPrice: 10 }];
  assert.throws(() => new Order(input), /batchId is required/);
});

test('order with qty <= 0 throws ValidationError', () => {
  const input = validOrderInput();
  input.items[0].qty = 0;
  assert.throws(() => new Order(input), /qty must be a number greater than 0/);
});

test('order with invalid sellerType throws ValidationError', () => {
  const input = validOrderInput();
  input.sellerType = 'WAREHOUSE';
  assert.throws(() => new Order(input), /sellerType must be one of/);
});

test('order with empty items array throws ValidationError', () => {
  const input = validOrderInput();
  input.items = [];
  assert.throws(() => new Order(input), /items must be a non-empty array/);
});

test('order item without title falls back to productId (Task 5: WhatsApp orders omit title)', () => {
  const input = validOrderInput();
  input.items = [{ productId: 'prd-honey-250g', batchId: 'b1', qty: 2, unitPrice: 450 }];
  const order = new Order(input);
  assert.strictEqual(order.items[0].title, 'prd-honey-250g');
});

test('applyStatus appends to statusHistory and sets updatedAt', () => {
  const order = new Order(validOrderInput());
  order.applyStatus('CONFIRMED');
  assert.strictEqual(order.status, 'CONFIRMED');
  assert.strictEqual(order.statusHistory.length, 2);
  assert.strictEqual(order.statusHistory[1].status, 'CONFIRMED');
  assert.ok(order.updatedAt); // updatedAt is set (may equal createdAt if same millisecond)
});

test('toJSON produces a plain serializable object matching the spec shape', () => {
  const order = new Order(validOrderInput());
  const json = order.toJSON();
  assert.strictEqual(typeof json.id, 'string');
  assert.strictEqual(json.orderType, 'CUSTOMER_ORDER');
  assert.ok(Array.isArray(json.items));
  assert.strictEqual(json.hasQualityIssue, false);
});

test('RESTOCK_ORDER uses the same Order entity, no separate class needed', () => {
  const input = validOrderInput();
  input.orderType = 'RESTOCK_ORDER';
  input.buyerId = 'store-301'; // a store, restocking
  const order = new Order(input);
  assert.strictEqual(order.orderType, 'RESTOCK_ORDER');
  assert.ok(order instanceof Order);
});
