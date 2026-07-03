'use strict';

const crypto = require('crypto');
const Razorpay = require('razorpay');

/**
 * Thin wrapper around the Razorpay SDK + HMAC signature checks.
 * Reads credentials from env at call time (not at require-time) so the
 * server can boot even before RAZORPAY_* is configured — it just fails
 * the specific request instead of crashing the whole process.
 */
class PaymentService {
  #client() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in backend/.env');
    }
    return new Razorpay({ key_id, key_secret });
  }

  /**
   * @param {number} amountRupees — rupees, converted to paise for Razorpay
   * @param {string} receipt — your own order reference (BazaarGrid order id)
   */
  async createOrder(amountRupees, receipt) {
    const order = await this.#client().orders.create({
      amount: Math.round(amountRupees * 100), // paise
      currency: 'INR',
      receipt,
    });
    return order; // { id, amount, currency, receipt, status, ... }
  }

  /** Verifies the signature Razorpay Checkout returns to the browser on success. */
  verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const expected = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    return expected === razorpay_signature;
  }

  /** Verifies the X-Razorpay-Signature header on incoming webhook events. */
  verifyWebhookSignature(rawBody, signatureHeader) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signatureHeader;
  }
}

module.exports = PaymentService;
