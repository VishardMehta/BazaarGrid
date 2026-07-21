'use strict';

/**
 * Handles the Meta WhatsApp Cloud API webhook (GET verify handshake +
 * POST message events) and a local /simulate endpoint that drives the
 * exact same conversation engine without a real WhatsApp number.
 */
class WhatsappWebhookController {
  constructor(conversationEngine, sender) {
    this.engine = conversationEngine;
    this.sender = sender;
    this.verify = this.verify.bind(this);
    this.receive = this.receive.bind(this);
    this.simulate = this.simulate.bind(this);
  }

  /** GET /whatsapp/webhook — Meta subscription verification. */
  verify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  #normalize(value) {
    const message = value?.messages?.[0];
    if (!message) return null;
    const from = message.from;
    const name = value?.contacts?.[0]?.profile?.name;
    if (message.type === 'text') {
      return { from, name, text: message.text?.body, interactiveId: null };
    }
    if (message.type === 'interactive') {
      const i = message.interactive;
      const reply = i?.list_reply ?? i?.button_reply;
      return { from, name, text: reply?.title ?? null, interactiveId: reply?.id ?? null };
    }
    return { from, name, text: null, interactiveId: null };
  }

  /** POST /whatsapp/webhook — inbound messages from Meta. */
  async receive(req, res) {
    // Ack immediately so Meta doesn't retry; process after.
    res.sendStatus(200);
    try {
      const change = req.body?.entry?.[0]?.changes?.[0]?.value;
      const input = this.#normalize(change);
      if (input?.from) await this.engine.handle(input);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[whatsapp webhook] error:', err.message);
    }
  }

  /**
   * POST /whatsapp/simulate  { from, text?, interactiveId?, name? }
   * Dev-only harness: runs the engine and returns the outbound messages
   * it would have sent, so the whole flow is curl-testable pre-Meta.
   */
  async simulate(req, res, next) {
    try {
      if (!this.sender.dryRun) {
        return res.status(400).json({ error: { message: 'Simulator is only available in dry-run (no WHATSAPP_TOKEN configured).' } });
      }
      const { from, text, interactiveId, name } = req.body;
      if (!from) return res.status(400).json({ error: { message: 'from (phone) is required' } });
      this.sender.resetDryRun();
      await this.engine.handle({ from, name, text: text ?? null, interactiveId: interactiveId ?? null });
      res.status(200).json({ data: { outbound: this.sender.lastDryRun } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = WhatsappWebhookController;
