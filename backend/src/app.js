'use strict';

const express = require('express');
const path = require('path');

const OrderRepositoryJson = require('./modules/order/infrastructure/repositories/order.repository.json');
const OrderService = require('./modules/order/application/services/order.service');
const OrderController = require('./modules/order/infrastructure/controllers/order.controller');
const buildOrderRoutes = require('./modules/order/infrastructure/routes/order.routes');
const CreateOrderUseCase = require('./modules/order/application/use-cases/create-order.usecase');

const WhatsappMessageService = require('./modules/whatsapp/application/services/whatsapp-message.service');
const CreateWhatsappOrderUseCase = require('./modules/whatsapp/application/use-cases/create-whatsapp-order.usecase');
const WhatsappController = require('./modules/whatsapp/infrastructure/controllers/whatsapp.controller');
const buildWhatsappRoutes = require('./modules/whatsapp/infrastructure/routes/whatsapp.routes');

const { WhatsappConversationEngine } = require('./modules/whatsapp/application/conversation-engine');
const WhatsappSender = require('./modules/whatsapp/infrastructure/whatsapp-sender');
const WhatsappWebhookController = require('./modules/whatsapp/infrastructure/controllers/whatsapp-webhook.controller');
const SupabaseRestClient = require('./shared/supabase/supabase-rest.client');

const PaymentService = require('./modules/payment/payment.service');
const PaymentController = require('./modules/payment/payment.controller');
const buildPaymentRoutes = require('./modules/payment/payment.routes');

const { errorHandlerMiddleware } = require('./shared/middleware/error-handler.middleware');

/**
 * Composition Root
 *
 * This is the ONE file in the whole codebase that knows the concrete
 * repository implementation is JSON-backed. Every other file talks to
 * abstractions. When you migrate to MongoDB:
 *
 *   1. Write OrderRepositoryMongo implementing OrderRepositoryInterface.
 *   2. Change ONE line below:
 *        const orderRepository = new OrderRepositoryMongo(connectionUri);
 *   3. Done. No other file changes.
 *
 * This function returns the configured app rather than calling
 * app.listen() itself, so server.js (the actual process entry point)
 * and any future test file (supertest against the app instance) can
 * both reuse it without binding a port.
 */
function createApp() {
  const app = express();

  // rawBody is captured for Razorpay webhook signature verification, which
  // must hash the exact bytes received, not a re-serialized JSON.parse result.
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));
  app.use(express.urlencoded({ extended: true }));

  // ---- Dependency wiring (manual DI) ----
  const ordersJsonPath = path.join(__dirname, 'data', 'orders.json');
  const orderRepository = new OrderRepositoryJson(ordersJsonPath);
  const orderService = new OrderService(orderRepository);
  const orderController = new OrderController(orderService);

  // ---- WhatsApp module wiring (Task 5) ----
  // Deliberately reuses the SAME orderRepository instance above — the
  // WhatsApp flow must persist through the exact same repository as
  // every other order. CreateOrderUseCase is instantiated once here
  // and handed to the WhatsApp use case; it is the same class, with
  // the same logic, as the one OrderService uses internally for
  // POST /orders. Nothing about order creation is reimplemented.
  const createOrderUseCase = new CreateOrderUseCase(orderRepository);
  const whatsappMessageService = new WhatsappMessageService();
  const createWhatsappOrderUseCase = new CreateWhatsappOrderUseCase(createOrderUseCase, whatsappMessageService);
  const whatsappController = new WhatsappController(createWhatsappOrderUseCase);

  // ---- Payment module wiring (Razorpay) ----
  const paymentService = new PaymentService();
  const paymentController = new PaymentController(paymentService);

  // ---- WhatsApp structured-commerce bot wiring ----
  // Reads the live catalogue and writes orders straight into Supabase
  // (channel: WHATSAPP), so producers see them in the same dashboard as
  // app/web orders. Reuses paymentService for the checkout payment link.
  const supabaseRest = new SupabaseRestClient();
  const whatsappSender = new WhatsappSender();
  const conversationEngine = new WhatsappConversationEngine({
    supabase: supabaseRest,
    sender: whatsappSender,
    paymentService,
  });
  const whatsappWebhookController = new WhatsappWebhookController(conversationEngine, whatsappSender);

  // ---- Static test UI ----
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // ---- API routes ----
  // WhatsApp routes are mounted at the same /orders prefix, BEFORE the
  // existing order router's catch-all 404 below. POST /orders/whatsapp
  // and the order router's own routes (GET /, GET /:id, POST /,
  // PATCH /:id/status, PATCH /:id/cancel) don't collide on method+path,
  // but mounting order is kept explicit and intentional here so a
  // future route addition doesn't accidentally get shadowed.
  app.use('/orders', buildWhatsappRoutes(whatsappController, whatsappWebhookController));
  app.use('/orders', buildOrderRoutes(orderController));
  app.use('/payments', buildPaymentRoutes(paymentController));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'bazaargrid-order-management' });
  });

  // 404 for unmatched API routes
  app.use('/orders', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Central error handler — must be registered last.
  app.use(errorHandlerMiddleware);

  return app;
}

module.exports = createApp;
