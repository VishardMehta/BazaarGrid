'use strict';

/**
 * WhatsApp structured-commerce conversation engine (BazaarGrid V1 — no NLP).
 *
 * Implements the roadmap's structured flow: pick store → browse catalogue →
 * quantity → cart → confirm → payment link → order. Orders land in the SAME
 * Supabase tables as app/web orders (channel: 'WHATSAPP'), so the unified
 * backend requirement holds — the producer sees them in the same dashboard.
 *
 * State lives in an in-memory Map keyed by phone number. That's fine for a
 * demo/MVP but resets on restart and won't scale across processes — production
 * should move sessions to a table or Redis (the handle() logic stays identical).
 *
 * Input is normalized upstream (webhook / simulator) to:
 *   { from, name, text, interactiveId }
 * where interactiveId is a list-row / button id like "store:<uuid>",
 * "prod:<uuid>", "add_more", "checkout", "confirm", "cancel".
 */

const STATES = {
  START: 'START',
  BROWSING: 'BROWSING',
  AWAITING_QTY: 'AWAITING_QTY',
  CART: 'CART',
  CONFIRMING: 'CONFIRMING',
};

class WhatsappConversationEngine {
  constructor({ supabase, sender, paymentService }) {
    this.supabase = supabase;
    this.sender = sender;
    this.payment = paymentService;
    this.sessions = new Map();
  }

  #session(from) {
    if (!this.sessions.has(from)) {
      this.sessions.set(from, { state: STATES.START, sellerId: null, pendingProductId: null, cart: [] });
    }
    return this.sessions.get(from);
  }

  #reset(from) {
    this.sessions.set(from, { state: STATES.START, sellerId: null, pendingProductId: null, cart: [] });
  }

  #cartTotal(session) {
    return session.cart.reduce((s, l) => s + l.price * l.qty, 0);
  }

  async handle({ from, name, text, interactiveId }) {
    const session = this.#session(from);
    const id = interactiveId ?? '';
    const said = (text ?? '').trim().toLowerCase();

    // Global commands from any state
    if (['hi', 'hello', 'menu', 'start', 'order'].includes(said) && !id) {
      this.#reset(from);
      return this.#showStores(from);
    }
    if (id === 'cancel' || said === 'cancel') {
      this.#reset(from);
      return this.sender.sendText(from, 'No problem — order cancelled. Send "hi" any time to start again.');
    }

    switch (session.state) {
      case STATES.START:
        if (id.startsWith('store:')) return this.#chooseStore(from, id.slice(6));
        return this.#showStores(from);

      case STATES.BROWSING:
        if (id.startsWith('store:')) return this.#chooseStore(from, id.slice(6));
        if (id.startsWith('prod:')) return this.#chooseProduct(from, id.slice(5));
        return this.#showCatalogue(from, session.sellerId, 'Tap a product to add it:');

      case STATES.AWAITING_QTY: {
        const qty = parseInt(said, 10);
        if (!Number.isFinite(qty) || qty < 1) {
          return this.sender.sendText(from, 'Please reply with a quantity as a number, e.g. 2');
        }
        return this.#addToCart(from, qty);
      }

      case STATES.CART:
        if (id === 'add_more') return this.#showCatalogue(from, session.sellerId, 'Add another product:');
        if (id === 'checkout') return this.#showConfirm(from);
        return this.#showCartButtons(from);

      case STATES.CONFIRMING:
        if (id === 'confirm') return this.#placeOrder(from, name);
        return this.#showConfirm(from);

      default:
        this.#reset(from);
        return this.#showStores(from);
    }
  }

  async #showStores(from) {
    const sellers = await this.supabase.activeSellers();
    if (!sellers.length) {
      return this.sender.sendText(from, 'No stores are open on BazaarGrid right now. Please try again later.');
    }
    const rows = sellers.slice(0, 10).map((s) => ({
      id: `store:${s.id}`,
      title: s.name.slice(0, 24),
      description: [s.village, s.region].filter(Boolean).join(', ').slice(0, 72),
    }));
    return this.sender.sendList(from, {
      header: 'BazaarGrid',
      body: 'Welcome! 🌾 Which store would you like to order from?',
      buttonText: 'Choose a store',
      rows,
    });
  }

  async #chooseStore(from, sellerId) {
    const session = this.#session(from);
    session.sellerId = sellerId;
    session.state = STATES.BROWSING;
    return this.#showCatalogue(from, sellerId, 'Here is the catalogue. Tap a product to add it:');
  }

  async #showCatalogue(from, sellerId, prompt) {
    const session = this.#session(from);
    session.state = STATES.BROWSING;
    const products = (await this.supabase.liveProductsForSeller(sellerId)).filter((p) => p.stock > 0);
    if (!products.length) {
      session.state = STATES.START;
      return this.sender.sendText(from, 'That store has no items in stock right now. Send "hi" to pick another store.');
    }
    const rows = products.slice(0, 10).map((p) => ({
      id: `prod:${p.id}`,
      title: p.name.slice(0, 24),
      description: `₹${p.price} / ${p.unit ?? 'each'}`.slice(0, 72),
    }));
    return this.sender.sendList(from, { body: prompt, buttonText: 'View products', rows });
  }

  async #chooseProduct(from, productId) {
    const session = this.#session(from);
    const product = await this.supabase.productById(productId);
    if (!product) return this.sender.sendText(from, "Sorry, that product isn't available. Tap another.");
    session.pendingProductId = productId;
    session.state = STATES.AWAITING_QTY;
    return this.sender.sendText(from, `How many *${product.name}* (₹${product.price} / ${product.unit ?? 'each'})? Reply with a number.`);
  }

  async #addToCart(from, qty) {
    const session = this.#session(from);
    const product = await this.supabase.productById(session.pendingProductId);
    if (!product) {
      session.state = STATES.BROWSING;
      return this.sender.sendText(from, 'That product is no longer available. Tap another.');
    }
    const capped = Math.min(qty, product.stock);
    const existing = session.cart.find((l) => l.productId === product.id);
    if (existing) existing.qty += capped;
    else session.cart.push({
      productId: product.id, name: product.name, price: product.price,
      unit: product.unit, qty: capped, sellerId: product.seller_id,
      traceable: product.traceable, batchId: product.batch_id,
    });
    session.pendingProductId = null;
    session.state = STATES.CART;
    const note = capped < qty ? ` (only ${capped} in stock)` : '';
    await this.sender.sendText(from, `Added ${capped} × ${product.name}${note}. Basket total: ₹${this.#cartTotal(session)}.`);
    return this.#showCartButtons(from);
  }

  async #showCartButtons(from) {
    const session = this.#session(from);
    session.state = STATES.CART;
    return this.sender.sendButtons(from, {
      body: 'What next?',
      buttons: [
        { id: 'add_more', title: 'Add more' },
        { id: 'checkout', title: 'Checkout' },
        { id: 'cancel', title: 'Cancel' },
      ],
    });
  }

  async #showConfirm(from) {
    const session = this.#session(from);
    if (!session.cart.length) {
      session.state = STATES.START;
      return this.sender.sendText(from, 'Your basket is empty. Send "hi" to start an order.');
    }
    session.state = STATES.CONFIRMING;
    const lines = session.cart.map((l) => `• ${l.qty} × ${l.name} = ₹${l.price * l.qty}`).join('\n');
    return this.sender.sendButtons(from, {
      body: `Please confirm your order:\n\n${lines}\n\n*Total: ₹${this.#cartTotal(session)}*`,
      buttons: [
        { id: 'confirm', title: 'Confirm order' },
        { id: 'cancel', title: 'Cancel' },
      ],
    });
  }

  async #placeOrder(from, name) {
    const session = this.#session(from);
    if (!session.cart.length) {
      session.state = STATES.START;
      return this.sender.sendText(from, 'Your basket is empty. Send "hi" to start an order.');
    }
    const total = this.#cartTotal(session);
    const buyerId = await this.supabase.resolveBuyerByPhone(from, name);

    const orderId = await this.supabase.createOrder(
      {
        buyer_id: buyerId,
        seller_id: session.sellerId,
        status: 'PLACED',
        channel: 'WHATSAPP',
        subtotal: total,
        delivery_fee: 0,
        rewards_discount: 0,
        total,
        fulfillment: 'DELIVERY',
        payment_method: 'UPI',
        payment_status: 'PENDING',
      },
      session.cart.map((l) => ({
        product_id: l.productId,
        seller_id: l.sellerId,
        name: l.name,
        unit: l.unit,
        quantity: l.qty,
        price: l.price,
        subtotal: l.price * l.qty,
        traceable: l.traceable ?? false,
        batch_id: l.batchId ?? null,
      })),
    );

    const link = await this.payment.createPaymentLink({
      amountRupees: total,
      reference: orderId,
    });

    this.#reset(from);
    return this.sender.sendText(
      from,
      `✅ Order *${orderId}* placed!\n\nPay ₹${total} securely here:\n${link.short_url}\n\n` +
        `You'll get updates here as the producer confirms and ships. Thank you for supporting local! 🌾`,
    );
  }
}

module.exports = { WhatsappConversationEngine, STATES };
