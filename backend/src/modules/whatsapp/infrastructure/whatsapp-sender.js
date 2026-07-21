'use strict';

/**
 * Sends outbound WhatsApp messages via the Meta Cloud API.
 *
 * When WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not configured, it
 * runs in DRY-RUN mode: instead of calling Meta, it records the outbound
 * payloads and logs them. This lets the entire conversation engine be
 * built and tested (via the /whatsapp/simulate endpoint) before a real
 * WhatsApp Business API number is provisioned — same "build up to the
 * credential boundary" approach used for Razorpay.
 */
class WhatsappSender {
  constructor() {
    this.token = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.lastDryRun = []; // outbound payloads captured in dry-run, for the simulator
  }

  get dryRun() {
    return !(this.token && this.phoneNumberId);
  }

  async #send(payload) {
    if (this.dryRun) {
      this.lastDryRun.push(payload);
      // eslint-disable-next-line no-console
      console.log('[whatsapp dry-run] →', JSON.stringify(payload));
      return { dryRun: true };
    }
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WhatsApp send ${res.status}: ${body}`);
    }
    return res.json();
  }

  resetDryRun() {
    this.lastDryRun = [];
  }

  /** Plain text reply. */
  async sendText(to, body) {
    return this.#send({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });
  }

  /**
   * Interactive list message (the WhatsApp-native way to show a
   * catalogue / store picker). rows: [{ id, title, description }].
   */
  async sendList(to, { header, body, buttonText, rows }) {
    return this.#send({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(header ? { header: { type: 'text', text: header } } : {}),
        body: { text: body },
        action: {
          button: buttonText,
          sections: [{ rows: rows.slice(0, 10) }], // WhatsApp caps rows at 10 per section
        },
      },
    });
  }

  /** Up to 3 reply buttons. buttons: [{ id, title }]. */
  async sendButtons(to, { body, buttons }) {
    return this.#send({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
        },
      },
    });
  }
}

module.exports = WhatsappSender;
