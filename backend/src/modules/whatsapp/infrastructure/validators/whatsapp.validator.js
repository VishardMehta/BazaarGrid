'use strict';

const { z } = require('zod');
const { orderItemSchema } = require('../../../order/infrastructure/validators/order.schema');
const { SELLER_TYPE, FULFILLMENT_MODE } = require('../../../order/constants/order.constants');

/**
 * WhatsApp Order Validator
 *
 * Reuses orderItemSchema (qty > 0, unitPrice > 0, batchId required)
 * from Task 3 and relaxes exactly one field: `title` becomes optional,
 * matching the Task 5 spec's example request body (which sends
 * productId/batchId/qty/unitPrice but no title) and the OrderItem
 * entity's productId fallback (see order-item.entity.js). Every other
 * item rule is identical to the main order flow — nothing is
 * redefined or weakened beyond that one field.
 *
 * A simple E.164-ish phone check is added here because phone is a
 * WhatsApp-only concept; it doesn't belong in the shared order schema.
 */

const whatsappOrderItemSchema = orderItemSchema.extend({
  title: z.string().min(1).optional(),
});

// Loose E.164 check: optional leading '+', 10-15 digits total. Good
// enough for "is this plausibly a phone number" without pretending to
// validate carrier-level correctness.
const phoneSchema = z
  .string()
  .min(1, 'phone is required')
  .regex(/^\+?\d{10,15}$/, 'phone must be a valid number, e.g. +919876543210');

const createWhatsappOrderSchema = z.object({
  buyerId: z.string().min(1, 'buyerId is required'),
  sellerType: z.enum([SELLER_TYPE.PRODUCER, SELLER_TYPE.LOCAL_STORE]),
  fulfillingSellerId: z.string().min(1, 'fulfillingSellerId is required'),
  phone: phoneSchema,
  fulfillmentMode: z.enum([FULFILLMENT_MODE.DELIVERY, FULFILLMENT_MODE.PICKUP]),
  items: z.array(whatsappOrderItemSchema).min(1, 'items must contain at least one item'),
});

module.exports = {
  createWhatsappOrderSchema,
};
