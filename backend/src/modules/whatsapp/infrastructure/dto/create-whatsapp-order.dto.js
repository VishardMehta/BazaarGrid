'use strict';

/**
 * CreateWhatsappOrderDto
 *
 * Maps "Zod-validated WhatsApp request body" to the plain object
 * CreateWhatsappOrderUseCase.execute() expects. Kept as an explicit
 * mapping (not a passthrough of req.body) for the same reason as
 * Task 3's create-order.dto.js: it's the seam where a renamed HTTP
 * field never silently renames a domain field, and where something
 * like a future `source: "STORE_APP" | "CUSTOMER_APP"` tag could be
 * attached without touching the use case or validator.
 */
function toCreateWhatsappOrderInput(validatedBody) {
  return {
    buyerId: validatedBody.buyerId,
    sellerType: validatedBody.sellerType,
    fulfillingSellerId: validatedBody.fulfillingSellerId,
    phone: validatedBody.phone,
    fulfillmentMode: validatedBody.fulfillmentMode,
    items: validatedBody.items,
  };
}

module.exports = {
  toCreateWhatsappOrderInput,
};
