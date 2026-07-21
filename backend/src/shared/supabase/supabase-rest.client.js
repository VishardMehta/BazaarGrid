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

  /** GoTrue Auth Admin API (service-role only) — /auth/v1/admin/*. */
  async #authAdmin(path, options = {}) {
    this.#assert();
    const res = await fetch(`${this.url}/auth/v1/admin/${path}`, {
      ...options,
      headers: this.#headers(options.headers),
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    return { ok: res.ok, status: res.status, body };
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
   * Resolve a WhatsApp phone number to a buyer profile, creating one if this
   * is a first-time buyer. Returns the profile id.
   *
   * profiles.id is `UUID REFERENCES auth.users(id) PRIMARY KEY` — it has NO
   * default AND is a foreign key, so we can neither omit it (null violation)
   * nor invent one (FK violation). The buyer must exist in auth.users first;
   * the on_auth_user_created trigger then inserts the profile row for us.
   * Upside: when this buyer later signs into the app with the same phone,
   * it's the same account and their WhatsApp orders are already there.
   */
  async resolveBuyerByPhone(phone, name) {
    // Twilio sends "whatsapp:+919876543210", Meta sends "919876543210".
    const digits = String(phone).replace(/\D/g, '');
    const displayName = name ?? `WhatsApp ${digits.slice(-4)}`;

    // Match either the raw value or the normalised digits, so profiles saved
    // by the app (+91…) and by the bot (91…) both resolve to one account.
    const existing = await this.#req(
      `profiles?or=(phone.eq.${encodeURIComponent(phone)},phone.eq.${digits})&select=id&limit=1`,
    );
    if (existing?.[0]) return existing[0].id;

    const authUserId = await this.#ensureAuthUser(digits, displayName);
    if (!authUserId) throw new Error(`Could not create an auth user for ${digits}`);

    // The trigger already inserted this row (without the phone); merge-duplicates
    // makes this an upsert so we set phone/name either way.
    const rows = await this.#req('profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id: authUserId,
        role: 'BUYER',
        status: 'ACTIVE',
        name: displayName,
        phone: digits,
      }),
    });
    return rows?.[0]?.id ?? authUserId;
  }

  /** Create (or find) the auth.users row backing a WhatsApp buyer. */
  async #ensureAuthUser(digits, displayName) {
    const meta = { name: displayName, source: 'WHATSAPP' };

    let res = await this.#authAdmin('users', {
      method: 'POST',
      body: JSON.stringify({ phone: digits, phone_confirm: true, user_metadata: meta }),
    });
    if (res.ok && res.body?.id) return res.body.id;

    // Some projects have phone auth disabled — fall back to a synthetic email.
    if (!res.ok) {
      res = await this.#authAdmin('users', {
        method: 'POST',
        body: JSON.stringify({
          email: `wa-${digits}@whatsapp.bazaargrid.local`,
          email_confirm: true,
          user_metadata: { ...meta, phone: digits },
        }),
      });
      if (res.ok && res.body?.id) return res.body.id;
    }

    // Already registered (e.g. profile row was deleted) — find them again.
    return this.#findAuthUserByPhone(digits);
  }

  async #findAuthUserByPhone(digits) {
    const res = await this.#authAdmin(`users?page=1&per_page=1000`);
    const users = res.body?.users ?? [];
    const hit = users.find(
      (u) => String(u.phone ?? '').replace(/\D/g, '') === digits
        || u.email === `wa-${digits}@whatsapp.bazaargrid.local`,
    );
    return hit?.id ?? null;
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
