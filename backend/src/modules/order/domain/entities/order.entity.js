'use strict';

const { v4: uuidv4 } = require('uuid');
const OrderItem = require('./order-item.entity');
const {
  ORDER_TYPE,
  SELLER_TYPE,
  CHANNEL,
  FULFILLMENT_MODE,
  ORDER_STATUS,
} = require('../../constants/order.constants');
const { ValidationError } = require('../../../../shared/errors/app-error');

/**
 * Order Entity — the single, unified representation of EVERY order in
 * BazaarGrid: customer-to-producer (DIRECT), customer-to-store
 * (RESELLER), and store-to-producer (RESTOCK). This is intentional and
 * load-bearing: see module docs. Differentiation happens via data
 * (orderType, sellerType), never via subclassing or separate models.
 *
 * This entity is framework-agnostic: no Express, no fs, no Mongo driver
 * imports. It can be unit tested in isolation and ported untouched into
 * a NestJS provider or a Mongoose schema's pre-save validation.
 */
class Order {
  constructor({
    id,
    orderType,
    buyerId,
    sellerType,
    fulfillingSellerId,
    items,
    channel,
    fulfillmentMode,
    status,
    total,
    hasQualityIssue,
    createdAt,
    updatedAt,
    statusHistory,
  }) {
    this._validateRequiredFields({
      orderType,
      buyerId,
      sellerType,
      fulfillingSellerId,
      items,
      channel,
      fulfillmentMode,
    });

    this.id = id || uuidv4();
    this.orderType = orderType;
    this.buyerId = buyerId;
    this.sellerType = sellerType;
    this.fulfillingSellerId = fulfillingSellerId;
    this.items = items.map((item) => (item instanceof OrderItem ? item : new OrderItem(item)));
    this.channel = channel;
    this.fulfillmentMode = fulfillmentMode;
    this.status = status || ORDER_STATUS.PLACED;
    this.total = typeof total === 'number' ? total : this.calculateTotal();
    this.hasQualityIssue = hasQualityIssue || false;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || this.createdAt;

    // Extension point for future audit/quality-issue features: a simple
    // append-only log of status changes. Not required by today's APIs,
    // but costs nothing now and prevents a painful retrofit later when
    // "Quality Issue Opened" needs to know exactly when COMPLETED happened.
    this.statusHistory = statusHistory || [
      { status: this.status, at: this.createdAt },
    ];
  }

  _validateRequiredFields({
    orderType,
    buyerId,
    sellerType,
    fulfillingSellerId,
    items,
    channel,
    fulfillmentMode,
  }) {
    if (!Object.values(ORDER_TYPE).includes(orderType)) {
      throw new ValidationError(`Order.orderType must be one of ${Object.values(ORDER_TYPE).join(', ')}`);
    }
    if (!buyerId) {
      throw new ValidationError('Order.buyerId is required');
    }
    if (!Object.values(SELLER_TYPE).includes(sellerType)) {
      throw new ValidationError(`Order.sellerType must be one of ${Object.values(SELLER_TYPE).join(', ')}`);
    }
    if (!fulfillingSellerId) {
      throw new ValidationError('Order.fulfillingSellerId is required');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Order.items must be a non-empty array');
    }
    if (!Object.values(CHANNEL).includes(channel)) {
      throw new ValidationError(`Order.channel must be one of ${Object.values(CHANNEL).join(', ')}`);
    }
    if (!Object.values(FULFILLMENT_MODE).includes(fulfillmentMode)) {
      throw new ValidationError(`Order.fulfillmentMode must be one of ${Object.values(FULFILLMENT_MODE).join(', ')}`);
    }
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.lineTotal(), 0);
  }

  /**
   * Mutates status + bookkeeping fields. Does NOT decide whether the
   * transition is legal — that's the policy's job (see
   * order-status.policy.js). Keeping "can I?" and "do it" separate is
   * what lets us unit test the rule table without constructing a full
   * Order, and lets the policy be reused by future entities (e.g. a
   * QualityIssue state machine) without inheriting from Order.
   */
  applyStatus(nextStatus) {
    this.status = nextStatus;
    this.updatedAt = new Date().toISOString();
    this.statusHistory.push({ status: nextStatus, at: this.updatedAt });
  }

  toJSON() {
    return {
      id: this.id,
      orderType: this.orderType,
      buyerId: this.buyerId,
      sellerType: this.sellerType,
      fulfillingSellerId: this.fulfillingSellerId,
      items: this.items.map((i) => i.toJSON()),
      channel: this.channel,
      fulfillmentMode: this.fulfillmentMode,
      status: this.status,
      total: this.total,
      hasQualityIssue: this.hasQualityIssue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      statusHistory: this.statusHistory,
    };
  }
}

module.exports = Order;
