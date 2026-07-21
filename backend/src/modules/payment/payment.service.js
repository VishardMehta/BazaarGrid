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

  get configured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  /**
   * Creates a Razorpay Payment Link — the right primitive for WhatsApp,
   * since it's a short URL the buyer taps in chat. In dry-run (no keys)
   * returns a placeholder so the conversation flow stays coherent while
   * the gateway is not yet wired.
   */
  async createPaymentLink({ amountRupees, reference, customer }) {
    if (!this.configured) {
      return { short_url: `https://rzp.io/i/DEMO-${reference}`, id: `plink_demo_${reference}`, dryRun: true };
    }
    const link = await this.#client().paymentLink.create({
      amount: Math.round(amountRupees * 100),
      currency: 'INR',
      description: `BazaarGrid order ${reference}`,
      reference_id: reference,
      customer: customer ?? undefined,
      notify: { sms: false, email: false },
      reminder_enable: false,
    });
    return link; // { short_url, id, ... }
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
