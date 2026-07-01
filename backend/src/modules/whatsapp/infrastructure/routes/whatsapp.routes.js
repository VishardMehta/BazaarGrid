'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../../../shared/middleware/async-handler');

/**
 * Builds the WhatsApp routes. Same pattern as order.routes.js: the
 * controller is passed in rather than imported as a singleton, so
 * app.js (the composition root) controls wiring.
 *
 * @param {import('../controllers/whatsapp.controller')} whatsappController
 */
function buildWhatsappRoutes(whatsappController) {
  const router = Router();

  router.post('/whatsapp', asyncHandler(whatsappController.createWhatsappOrder));

  return router;
}

module.exports = buildWhatsappRoutes;
