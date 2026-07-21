'use strict';

class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  /** POST /payments/create-order  { amount: rupees, receipt: bazaargridOrderId } */
  createOrder = async (req, res, next) => {
    try {
      const { amount, receipt } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: { code: 'INVALID_AMOUNT', message: 'amount must be a positive number of rupees' } });
      }
      const order = await this.paymentService.createOrder(amount, receipt ?? undefined);
      res.status(201).json({ data: { orderId: order.id, amount: order.amount, currency: order.currency } });
    } catch (err) {
      next(err);
    }
  };

  /** POST /payments/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature } */
  verify = async (req, res, next) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required' } });
      }
      const valid = this.paymentService.verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
      if (!valid) {
        return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'Payment signature verification failed' } });
      }
      res.status(200).json({ data: { verified: true, paymentId: razorpay_payment_id } });
    } catch (err) {
      next(err);
    }
  };

  /** POST /payments/webhook — Razorpay server→server payment.captured/failed events */
  webhook = async (req, res, next) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const valid = this.paymentService.verifyWebhookSignature(req.rawBody ?? JSON.stringify(req.body), signature);
      if (!valid) {
        return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'Webhook signature verification failed' } });
      }
      // Event received and verified. BazaarGrid's own order/payment status
      // lives in Supabase, updated by the frontend after verify() succeeds;
      // this endpoint exists so Razorpay has a reliable async fallback if
      // the browser closes before that call completes. Extend here to also
      // update Supabase directly once a service-role key is available
      // server-side (do not use the anon key for this).
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = PaymentController;
