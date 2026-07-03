'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../../../shared/middleware/async-handler');

/**
 * Builds the WhatsApp routes. Same pattern as order.routes.js: the
 * controller is passed in rather than imported as a singleton, so
 * app.js (the composition root) controls wiring.
 *
 * @param {import('../controllers/whatsapp.controller')} whatsappController
 * @param {import('../controllers/whatsapp-webhook.controller')} [webhookController]
 */
function buildWhatsappRoutes(whatsappController, webhookController) {
  const router = Router();

  router.post('/whatsapp', asyncHandler(whatsappController.createWhatsappOrder));

  // Structured-commerce bot. Mounted under /orders in app.js, so the full
  // paths are /orders/whatsapp/webhook and /orders/whatsapp/simulate.
  if (webhookController) {
    router.get('/whatsapp/webhook', webhookController.verify);
    router.post('/whatsapp/webhook', asyncHandler(webhookController.receive));
    router.post('/whatsapp/simulate', asyncHandler(webhookController.simulate));
  }

  return router;
}

module.exports = buildWhatsappRoutes;
