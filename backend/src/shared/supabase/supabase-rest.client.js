'use strict';

/**
 * Minimal Supabase (PostgREST) client using global fetch — no SDK, no
 * WebSocket dependency (supabase-js pulls in realtime, which needs a WS
 * polyfill on Node < 22). The WhatsApp bot only needs plain REST reads
 * and writes, so this is all it takes.
 *
 * Uses the SERVICE ROLE key: the WhatsApp buyer is not authenticated
 * through Supabase Auth, so RLS can't identify them. Service-role
 * bypasses RLS and inserts orders with the correct buyer_id resolved
 * from the phone number. This key MUST stay server-side (backend/.env),
 * never in VITE_* or any committed file.
 */
class SupabaseRestClient {
  constructor() {
    this.url = process.env.SUPABASE_URL;
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  get configured() {
    return Boolean(this.url && this.serviceKey);
  }

  #headers(extra = {}) {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  #assert() {
    if (!this.configured) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in backend/.env');
    }
  }

  async #req(path, options = {}) {
    this.#assert();
    const res = await fetch(`${this.url}/rest/v1/${path}`, {
      ...options,
      headers: this.#headers(options.headers),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${body}`);
    }
    // 204 No Content on some writes
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /** LIVE products for a seller, cheapest catalogue view for the bot. */
  async liveProductsForSeller(sellerId) {
    return this.#req(
      `products?seller_id=eq.${sellerId}&status=eq.LIVE&select=id,name,price,unit,stock,traceable,batch_id&order=name`,
    );
  }

  /** Active sellers, optionally filtered by district (buyer's location). */
  async activeSellers(district) {
    const districtFilter = district
      ? `&village_id=in.(${await this.#villageIdsInDistrict(district)})`
      : '';
    return this.#req(
      `sellers?status=eq.ACTIVE&select=id,name,type,village,region,village_id${districtFilter}&order=name`,
    );
  }

  async #villageIdsInDistrict(district) {
    const villages = await this.#req(
      `villages?district=eq.${encodeURIComponent(district)}&select=id`,
    );
    const ids = (villages ?? []).map((v) => v.id);
    return ids.length ? ids.join(',') : '00000000-0000-0000-0000-000000000000';
  }

  async productById(productId) {
    const rows = await this.#req(
      `products?id=eq.${productId}&select=id,name,price,unit,stock,seller_id,traceable,batch_id`,
    );
    return rows?.[0] ?? null;
  }

  /**
   * Resolve a WhatsApp phone number to a buyer profile, creating a
   * lightweight BUYER profile if none exists. Returns the profile id.
   */
  async resolveBuyerByPhone(phone, name) {
    const existing = await this.#req(
      `profiles?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`,
    );
    if (existing?.[0]) return existing[0].id;

    const created = await this.#req('profiles', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ role: 'BUYER', status: 'ACTIVE', name: name ?? `WhatsApp ${phone.slice(-4)}`, phone }),
    });
    return created?.[0]?.id ?? null;
  }

  /** Insert an order + its items. Returns the created order id. */
  async createOrder(order, items) {
    const created = await this.#req('orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(order),
    });
    const orderId = created?.[0]?.id;
    if (!orderId) throw new Error('Order insert returned no id');

    await this.#req('order_items', {
      method: 'POST',
      body: JSON.stringify(items.map((it) => ({ ...it, order_id: orderId }))),
    });
    return orderId;
  }
}

module.exports = SupabaseRestClient;
