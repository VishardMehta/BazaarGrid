'use strict';

const { buildOrderMessage } = require('../../domain/builders/whatsapp-message.builder');

/**
 * WhatsappMessageService
 *
 * Thin layer above the pure builder: takes a created Order plus the
 * buyer's phone number, returns the final wa.me URL. This is "Light
 * WhatsApp Flow" by design — no Business API, no webhooks, no OAuth.
 * It's just a deep link that pre-fills a message in the customer's own
 * WhatsApp client when they tap it.
 *
 * Phone numbers must be in E.164-ish form (leading +, digits only
 * after that) by the time they reach here — validated upstream by
 * whatsapp.validator.js. This service strips the "+" because wa.me
 * expects bare country-code-prefixed digits.
 */
class WhatsappMessageService {
  /**
   * @param {import('../../../order/domain/entities/order.entity')} order
   * @param {string} phone - E.164 format, e.g. "+919876543210"
   * @returns {{ message: string, whatsappUrl: string }}
   */
  buildOrderWhatsappLink(order, phone) {
    const message = buildOrderMessage(order);
    const sanitizedPhone = phone.replace(/[^\d]/g, ''); // wa.me wants digits only, no "+"
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;

    return { message, whatsappUrl };
  }
}

module.exports = WhatsappMessageService;
