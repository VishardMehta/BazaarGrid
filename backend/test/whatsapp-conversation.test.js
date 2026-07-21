'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { WhatsappConversationEngine } = require('../src/modules/whatsapp/application/conversation-engine');
const WhatsappSender = require('../src/modules/whatsapp/infrastructure/whatsapp-sender');
const PaymentService = require('../src/modules/payment/payment.service');

function makeStub() {
  const PRODUCTS = {
    's1': [
      { id: 'p1', name: 'Forest Honey', price: 250, unit: '500g', stock: 10, seller_id: 's1', traceable: true, batch_id: 'B1' },
      { id: 'p2', name: 'Sunflower Oil', price: 180, unit: '1L', stock: 5, seller_id: 's1', traceable: true, batch_id: 'B2' },
    ],
  };
  return {
    orders: [],
    async activeSellers() { return [{ id: 's1', name: 'Green Valley', type: 'VILLAGE_PRODUCER', village: 'GV', region: 'HP' }]; },
    async liveProductsForSeller(id) { return PRODUCTS[id] ?? []; },
    async productById(pid) { return Object.values(PRODUCTS).flat().find((p) => p.id === pid) ?? null; },
    async resolveBuyerByPhone(phone) { return 'buyer-' + phone; },
    async createOrder(order, items) { this.orders.push({ order, items }); return 'BG-XYZ'; },
  };
}

async function run(engine, sender, from, input) {
  sender.resetDryRun();
  await engine.handle({ from, ...input });
  return sender.lastDryRun;
}

test('WhatsApp structured order: full happy path writes a WHATSAPP order', async () => {
  const supabase = makeStub();
  const sender = new WhatsappSender();      // dry-run
  const engine = new WhatsappConversationEngine({ supabase, sender, paymentService: new PaymentService() });
  const from = '911111111111';

  let out = await run(engine, sender, from, { text: 'hi' });
  assert.equal(out[0].interactive.type, 'list', 'greeting shows a store list');

  out = await run(engine, sender, from, { interactiveId: 'store:s1' });
  assert.equal(out[0].interactive.type, 'list', 'store pick shows catalogue');

  await run(engine, sender, from, { interactiveId: 'prod:p1' });
  await run(engine, sender, from, { text: '2' });
  await run(engine, sender, from, { interactiveId: 'checkout' });
  out = await run(engine, sender, from, { interactiveId: 'confirm' });

  assert.equal(supabase.orders.length, 1, 'one order persisted');
  const { order, items } = supabase.orders[0];
  assert.equal(order.channel, 'WHATSAPP');
  assert.equal(order.status, 'PLACED');
  assert.equal(order.total, 500);
  assert.equal(items.length, 1);
  assert.equal(items[0].batch_id, 'B1');
  assert.match(out[0].text.body, /Order \*BG-XYZ\* placed/);
});

test('WhatsApp order caps quantity to available stock', async () => {
  const supabase = makeStub();
  const sender = new WhatsappSender();
  const engine = new WhatsappConversationEngine({ supabase, sender, paymentService: new PaymentService() });
  const from = '922222222222';

  await run(engine, sender, from, { text: 'hi' });
  await run(engine, sender, from, { interactiveId: 'store:s1' });
  await run(engine, sender, from, { interactiveId: 'prod:p2' }); // stock 5
  const out = await run(engine, sender, from, { text: '9' });    // ask 9

  assert.match(out[0].text.body, /only 5 in stock/);
});

test('cancel resets the session', async () => {
  const supabase = makeStub();
  const sender = new WhatsappSender();
  const engine = new WhatsappConversationEngine({ supabase, sender, paymentService: new PaymentService() });
  const from = '933333333333';

  await run(engine, sender, from, { text: 'hi' });
  await run(engine, sender, from, { interactiveId: 'store:s1' });
  const out = await run(engine, sender, from, { interactiveId: 'cancel' });
  assert.match(out[0].text.body, /cancelled/i);
});
