'use strict';

const express = require('express');

function buildPaymentRoutes(paymentController) {
  const router = express.Router();
  router.post('/create-order', paymentController.createOrder);
  router.post('/verify', paymentController.verify);
  router.post('/webhook', paymentController.webhook);
  return router;
}

module.exports = buildPaymentRoutes;
