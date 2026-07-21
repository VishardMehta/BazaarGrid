'use strict';

const assert = require('node:assert');
const { test } = require('node:test');
const { canTransition, isTerminal } = require('../src/modules/order/domain/policies/order-status.policy');
const { ORDER_STATUS } = require('../src/modules/order/constants/order.constants');

/**
 * This file demonstrates exactly the "unit-test friendly" requirement
 * from the spec: testing core business rules requires zero mocking,
 * zero fs, zero Express, zero DI wiring. Just import the pure function
 * and assert against it.
 */

test('PLACED -> CONFIRMED is allowed', () => {
  assert.strictEqual(canTransition(ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED), true);
});

test('PLACED -> FULFILLED is NOT allowed (cannot skip steps)', () => {
  assert.strictEqual(canTransition(ORDER_STATUS.PLACED, ORDER_STATUS.FULFILLED), false);
});

test('COMPLETED -> PLACED is NOT allowed (terminal state cannot reopen)', () => {
  assert.strictEqual(canTransition(ORDER_STATUS.COMPLETED, ORDER_STATUS.PLACED), false);
});

test('CANCELLED -> anything is NOT allowed (terminal)', () => {
  assert.strictEqual(canTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.PLACED), false);
  assert.strictEqual(canTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.CONFIRMED), false);
  assert.strictEqual(canTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED), false);
});

test('PLACED -> CANCELLED is allowed (alternative path)', () => {
  assert.strictEqual(canTransition(ORDER_STATUS.PLACED, ORDER_STATUS.CANCELLED), true);
});

test('full happy path is allowed step by step', () => {
  assert.strictEqual(canTransition(ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED), true);
  assert.strictEqual(canTransition(ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED), true);
  assert.strictEqual(canTransition(ORDER_STATUS.PACKED, ORDER_STATUS.FULFILLED), true);
  assert.strictEqual(canTransition(ORDER_STATUS.FULFILLED, ORDER_STATUS.COMPLETED), true);
});

test('COMPLETED and CANCELLED are terminal', () => {
  assert.strictEqual(isTerminal(ORDER_STATUS.COMPLETED), true);
  assert.strictEqual(isTerminal(ORDER_STATUS.CANCELLED), true);
  assert.strictEqual(isTerminal(ORDER_STATUS.PLACED), false);
});

test('unknown status returns false rather than throwing', () => {
  assert.strictEqual(canTransition('NOT_A_REAL_STATUS', ORDER_STATUS.PLACED), false);
});
