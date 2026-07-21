'use strict';

const { ValidationError } = require('../../../../shared/errors/app-error');

/**
 * OrderItem Entity
 *
 * Represents a single line item within an order. `batchId` is mandatory
 * because traceability (recall a bad batch, audit a supplier) is a
 * stated requirement, not an afterthought — so it's enforced at the
 * entity boundary, not just in the Zod schema. Two layers of defense:
 * Zod stops malformed HTTP input; the entity stops any future caller
 * (e.g. an internal script, a future message-queue consumer) that
 * bypasses HTTP entirely.
 */
class OrderItem {
  constructor({ productId, batchId, title, qty, unitPrice }) {
    if (!productId) throw new ValidationError('OrderItem.productId is required');
    if (!batchId) throw new ValidationError('OrderItem.batchId is required for traceability');
    // title is OPTIONAL as of Task 5 (WhatsApp Order Flow): the WhatsApp
    // request shape only sends productId/batchId/qty/unitPrice — no
    // human-readable name. Rather than force every caller to invent one,
    // we fall back to productId so the entity always has something
    // displayable (e.g. in the WhatsApp message builder or the UI),
    // without weakening any other invariant.
    if (typeof qty !== 'number' || qty <= 0) {
      throw new ValidationError('OrderItem.qty must be a number greater than 0');
    }
    if (typeof unitPrice !== 'number' || unitPrice <= 0) {
      throw new ValidationError('OrderItem.unitPrice must be a number greater than 0');
    }

    this.productId = productId;
    this.batchId = batchId;
    this.title = title || productId;
    this.qty = qty;
    this.unitPrice = unitPrice;
  }

  lineTotal() {
    return this.qty * this.unitPrice;
  }

  toJSON() {
    return {
      productId: this.productId,
      batchId: this.batchId,
      title: this.title,
      qty: this.qty,
      unitPrice: this.unitPrice,
    };
  }
}

module.exports = OrderItem;
