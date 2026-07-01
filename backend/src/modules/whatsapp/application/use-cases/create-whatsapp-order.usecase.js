'use strict';

const { ORDER_TYPE, CHANNEL } = require('../../../order/constants/order.constants');

/**
 * CreateWhatsappOrderUseCase
 *
 * THIS IS THE INTEGRATION POINT WITH TASK 3.
 *
 * It does NOT construct an Order. It does NOT touch the repository.
 * It does NOT duplicate any validation already enforced by the Order
 * entity. It receives the EXISTING CreateOrderUseCase instance (the
 * very same one wired up for the regular `/orders` endpoint) and
 * calls `.execute()` on it, after normalizing the WhatsApp request
 * shape into what that use case already expects:
 *
 *   - orderType defaults to CUSTOMER_ORDER (WhatsApp is always a
 *     customer placing an order — restocking is a store-to-producer
 *     B2B flow with no WhatsApp UX in this spec)
 *   - channel is forced to WHATSAPP, overriding anything the caller
 *     might try to send
 *
 * After the order exists, it asks WhatsappMessageService to build the
 * message + wa.me URL from the order that came back — order creation
 * and message generation are two distinct steps, kept in two distinct
 * collaborators, so each stays trivially testable in isolation.
 */
class CreateWhatsappOrderUseCase {
  /**
   * @param {import('../../../order/application/use-cases/create-order.usecase')} createOrderUseCase
   *   - the EXISTING Task 3 use case instance, injected, never reimplemented
   * @param {import('../services/whatsapp-message.service')} whatsappMessageService
   */
  constructor(createOrderUseCase, whatsappMessageService) {
    this.createOrderUseCase = createOrderUseCase;
    this.whatsappMessageService = whatsappMessageService;
  }

  /**
   * @param {object} input - shape-validated by whatsapp.validator.js
   * @param {string} input.buyerId
   * @param {string} input.sellerType
   * @param {string} input.fulfillingSellerId
   * @param {string} input.phone
   * @param {string} input.fulfillmentMode
   * @param {Array}  input.items
   */
  async execute(input) {
    // Normalize into exactly the shape order/create-order.usecase.js
    // expects. This is the ONLY place orderType/channel are decided
    // for WhatsApp orders — no other file hardcodes these.
    const createOrderInput = {
      orderType: ORDER_TYPE.CUSTOMER_ORDER,
      buyerId: input.buyerId,
      sellerType: input.sellerType,
      fulfillingSellerId: input.fulfillingSellerId,
      items: input.items,
      channel: CHANNEL.WHATSAPP,
      fulfillmentMode: input.fulfillmentMode,
    };

    // Delegates to the EXISTING Task 3 use case. Order construction,
    // invariant validation, total calculation, persistence, and the
    // order.created domain event are all handled there, unchanged.
    const order = await this.createOrderUseCase.execute(createOrderInput);

    const { whatsappUrl } = this.whatsappMessageService.buildOrderWhatsappLink(order, input.phone);

    return { order, whatsappUrl };
  }
}

module.exports = CreateWhatsappOrderUseCase;
