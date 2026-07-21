'use strict';

const { z } = require('zod');
const {
  ORDER_TYPE,
  SELLER_TYPE,
  CHANNEL,
  FULFILLMENT_MODE,
  ORDER_STATUS,
} = require('../../constants/order.constants');

/**
 * Zod Schemas — HTTP Boundary Validation
 *
 * WHY ZOD HERE AND ENTITY VALIDATION TOO (looks redundant, isn't):
 * Zod validates the SHAPE of untrusted HTTP input (right types, no
 * missing fields, friendly error messages for API consumers). The
 * Order entity validates DOMAIN invariants regardless of where the
 * data came from (HTTP, a script, a future Kafka consumer, a test).
 * Two different concerns, two different layers, deliberately
 * overlapping at the edges for defense in depth.
 */

const orderItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  batchId: z.string().min(1, 'batchId is required for traceability'),
  title: z.string().min(1, 'title is required'),
  qty: z.number({ invalid_type_error: 'qty must be a number' }).positive('qty must be greater than 0'),
  unitPrice: z
    .number({ invalid_type_error: 'unitPrice must be a number' })
    .positive('unitPrice must be greater than 0'),
});

const createOrderSchema = z.object({
  orderType: z.enum([ORDER_TYPE.CUSTOMER_ORDER, ORDER_TYPE.RESTOCK_ORDER]),
  buyerId: z.string().min(1, 'buyerId is required'),
  sellerType: z.enum([SELLER_TYPE.PRODUCER, SELLER_TYPE.LOCAL_STORE]),
  fulfillingSellerId: z.string().min(1, 'fulfillingSellerId is required'),
  items: z.array(orderItemSchema).min(1, 'items must contain at least one item'),
  channel: z.enum([CHANNEL.APP, CHANNEL.WHATSAPP]),
  fulfillmentMode: z.enum([FULFILLMENT_MODE.DELIVERY, FULFILLMENT_MODE.PICKUP]),
});

const updateStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.PLACED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.FULFILLED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ]),
});

const orderQuerySchema = z.object({
  sellerType: z.enum([SELLER_TYPE.PRODUCER, SELLER_TYPE.LOCAL_STORE]).optional(),
  orderType: z.enum([ORDER_TYPE.CUSTOMER_ORDER, ORDER_TYPE.RESTOCK_ORDER]).optional(),
  status: z
    .enum([
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.FULFILLED,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ])
    .optional(),
  buyerId: z.string().optional(),
  fulfillingSellerId: z.string().optional(),
  channel: z.enum([CHANNEL.APP, CHANNEL.WHATSAPP]).optional(),
});

module.exports = {
  orderItemSchema,
  createOrderSchema,
  updateStatusSchema,
  orderQuerySchema,
};
