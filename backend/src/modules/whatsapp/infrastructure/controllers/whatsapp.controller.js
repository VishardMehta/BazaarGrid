'use strict';

const { createWhatsappOrderSchema } = require('../validators/whatsapp.validator');
const { toCreateWhatsappOrderInput } = require('../dto/create-whatsapp-order.dto');

/**
 * WhatsappController
 *
 * Same shape and same discipline as order.controller.js: parse, call
 * use case, shape response. No business logic. Response shape matches
 * the spec exactly:
 *   { success, message, orderId, whatsappUrl }
 * rather than the { data: ... } envelope order.controller.js uses,
 * because that's the contract this endpoint's spec defines and the
 * frontend (whatsapp-order.html) is built against it.
 */
class WhatsappController {
  /**
   * @param {import('../../application/use-cases/create-whatsapp-order.usecase')} createWhatsappOrderUseCase
   */
  constructor(createWhatsappOrderUseCase) {
    this.createWhatsappOrderUseCase = createWhatsappOrderUseCase;
    this.createWhatsappOrder = this.createWhatsappOrder.bind(this);
  }

  async createWhatsappOrder(req, res) {
    const validatedBody = createWhatsappOrderSchema.parse(req.body);
    const input = toCreateWhatsappOrderInput(validatedBody);

    const { order, whatsappUrl } = await this.createWhatsappOrderUseCase.execute(input);

    res.status(201).json({
      success: true,
      message: 'WhatsApp order created successfully',
      orderId: order.id,
      whatsappUrl,
    });
  }
}

module.exports = WhatsappController;
