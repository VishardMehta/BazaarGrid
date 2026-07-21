'use strict';

/**
 * CreateOrderDto
 *
 * Thin mapping function from "Zod-validated request body" to "the
 * plain object shape CreateOrderUseCase expects." Today these shapes
 * are identical, which can make this file feel pointless — but it's
 * the seam where, e.g., a future `idempotencyKey` header or
 * `req.user.id` injected as `placedByUserId` gets attached without
 * touching the use case or the Zod schema. Keeping the mapping
 * explicit (rather than passing `req.body` straight through) also
 * means a renamed HTTP field never silently renames a domain field.
 */
function toCreateOrderInput(validatedBody) {
  return {
    orderType: validatedBody.orderType,
    buyerId: validatedBody.buyerId,
    sellerType: validatedBody.sellerType,
    fulfillingSellerId: validatedBody.fulfillingSellerId,
    items: validatedBody.items,
    channel: validatedBody.channel,
    fulfillmentMode: validatedBody.fulfillmentMode,
  };
}

module.exports = {
  toCreateOrderInput,
};
