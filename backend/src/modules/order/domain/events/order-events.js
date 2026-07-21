'use strict';

/**
 * Order Domain Events
 *
 * WHY THIS EXISTS NOW (even with nothing to do yet):
 * The spec asks for "prepare extension points" for a future Quality
 * Issue feature, without redesigning Order later. The cheapest, most
 * future-proof seam is a tiny in-process event emitter: when an order
 * reaches COMPLETED, we publish an event. Today, nothing listens. When
 * the quality-issue module ships, it registers a listener here and
 * gets everything it needs (orderId, items with batchId, completedAt)
 * without a single line of order.entity.js or any use-case changing.
 *
 * This is intentionally NOT a message queue / Kafka / EventEmitter from
 * a DI container — that would be over-engineering for the current
 * scope. It's a plain Node EventEmitter, swappable for a real broker
 * later without touching call sites (they just call `publish`).
 */
const { EventEmitter } = require('events');

const orderEvents = new EventEmitter();

const ORDER_EVENT_NAMES = Object.freeze({
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_COMPLETED: 'order.completed', // <- future quality-issue module hooks here
  ORDER_CANCELLED: 'order.cancelled',
});

function publishOrderCreated(order) {
  orderEvents.emit(ORDER_EVENT_NAMES.ORDER_CREATED, { order });
}

function publishOrderStatusChanged(order, previousStatus) {
  orderEvents.emit(ORDER_EVENT_NAMES.ORDER_STATUS_CHANGED, { order, previousStatus });

  if (order.status === 'COMPLETED') {
    orderEvents.emit(ORDER_EVENT_NAMES.ORDER_COMPLETED, {
      orderId: order.id,
      items: order.items,
      completedAt: order.updatedAt,
    });
  }
  if (order.status === 'CANCELLED') {
    orderEvents.emit(ORDER_EVENT_NAMES.ORDER_CANCELLED, { orderId: order.id });
  }
}

module.exports = {
  orderEvents,
  ORDER_EVENT_NAMES,
  publishOrderCreated,
  publishOrderStatusChanged,
};
