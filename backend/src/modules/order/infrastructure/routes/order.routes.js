'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../../../shared/middleware/async-handler');

/**
 * Builds the order routes. Takes the controller as a parameter
 * (rather than importing a singleton) so the composition root
 * (app.js) controls wiring — this is what keeps the route file
 * testable and decoupled from a specific repository implementation.
 *
 * @param {import('../controllers/order.controller')} orderController
 */
function buildOrderRoutes(orderController) {
  const router = Router();

  router.get('/', asyncHandler(orderController.getOrders));
  router.get('/:id', asyncHandler(orderController.getOrderById));
  router.post('/', asyncHandler(orderController.createOrder));
  router.patch('/:id/status', asyncHandler(orderController.updateOrderStatus));
  router.patch('/:id/cancel', asyncHandler(orderController.cancelOrder));

  return router;
}

module.exports = buildOrderRoutes;
