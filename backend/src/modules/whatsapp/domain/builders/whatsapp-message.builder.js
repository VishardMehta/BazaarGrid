'use strict';

/**
 * WhatsappMessageBuilder
 *
 * Pure, framework-agnostic message construction. Takes a domain Order
 * (already created, already persisted) and produces the human-readable
 * text that goes into the wa.me link. Deliberately has zero knowledge
 * of HTTP, Express, or how the order was created — it only knows how
 * to render an Order into a message. This is what makes it trivially
 * unit-testable (see test/whatsapp-message.builder.test.js) and
 * reusable if a future channel (SMS, push notification) wants a
 * similarly formatted summary.
 *
 * Order IDs are rendered as "ORD-<shortId>" purely for readability in
 * the message — the underlying order.id (a uuid) is what's actually
 * used everywhere else (API responses, lookups, persistence).
 */

function formatOrderIdForDisplay(orderId) {
  // Use the last 6 characters of the uuid as a short, human-friendly
  // reference. Not used for lookups anywhere — display only.
  const shortId = orderId.replace(/-/g, '').slice(-6).toUpperCase();
  return `ORD-${shortId}`;
}

function formatItemLine(item) {
  return `• ${item.title} × ${item.qty}`;
}

/**
 * @param {import('../../../order/domain/entities/order.entity')} order
 * @returns {string} plain-text WhatsApp message
 */
function buildOrderMessage(order) {
  const displayId = formatOrderIdForDisplay(order.id);
  const itemLines = order.items.map(formatItemLine).join('\n');

  return [
    'Hello \uD83D\uDC4B',
    '',
    "I'd like to place an order.",
    '',
    `Order ID: ${displayId}`,
    '',
    'Items',
    itemLines,
    '',
    `Total: \u20B9${order.total}`,
    `Fulfillment: ${order.fulfillmentMode}`,
    '',
    'Thank you.',
  ].join('\n');
}

module.exports = {
  buildOrderMessage,
  formatOrderIdForDisplay,
};
