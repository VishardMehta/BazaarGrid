-- BazaarGrid — Shared catalogue + multi-seller offers (kirana stores).
-- Run in Supabase SQL Editor AFTER schema.sql, fixes.sql, location_and_collectives.sql.
-- Safe to re-run.
--
-- WHY: village producers sell UNIQUE goods (this honey, this weave) — one
-- product = one maker, with a heritage story + traceability passport. A kirana
-- store sells COMMODITY goods (Tata Salt, Aashirvaad Atta) that MANY stores
-- carry. The buyer should search "Tata Salt" once and pick WHICH store to buy
-- from by price / distance / stock.
--
-- MODEL: `catalog_items` is the canonical SKU shared across stores. A store's
-- "offer" on that SKU is just a normal `products` row with `catalog_item_id`
-- set (its own price + stock). So cart → orders → order_items → fulfillment →
-- the WhatsApp bot all keep working unchanged: an offer IS a product.
--   catalog_item_id IS NULL  → unique product (village producer, today's flow).
--   catalog_item_id IS SET   → a store's offer on a shared SKU.

-- ════════════════════════════════════════════════════════════
--  Canonical catalogue SKUs
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS catalog_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,          -- "Aashirvaad Superior MP Atta"
  brand      TEXT,                   -- "Aashirvaad"
  category   TEXT DEFAULT 'GROCERY',
  unit       TEXT,                   -- "5 kg", "1 L", "500 ml"
  image_url  TEXT,
  barcode    TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "catalog_public_read"  ON catalog_items;
DROP POLICY IF EXISTS "catalog_auth_insert"  ON catalog_items;
-- Anyone can read the shared catalogue; any signed-in seller can add a new SKU.
CREATE POLICY "catalog_public_read"  ON catalog_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_auth_insert"  ON catalog_items FOR INSERT TO authenticated WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
--  Link products → catalogue. NULL keeps today's unique-product behaviour.
-- ════════════════════════════════════════════════════════════
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS products_catalog_item_idx ON products(catalog_item_id) WHERE catalog_item_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════
--  Seed common kirana SKUs (fixed UUIDs so re-runs stay idempotent)
-- ════════════════════════════════════════════════════════════
INSERT INTO catalog_items (id, name, brand, category, unit) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Aashirvaad Superior MP Atta', 'Aashirvaad', 'GRAINS',  '5 kg'),
  ('c1000000-0000-0000-0000-000000000002', 'Tata Salt',                   'Tata',       'GROCERY', '1 kg'),
  ('c1000000-0000-0000-0000-000000000003', 'Amul Gold Full Cream Milk',   'Amul',       'DAIRY',   '500 ml'),
  ('c1000000-0000-0000-0000-000000000004', 'Fortune Sunlite Sunflower Oil','Fortune',   'OILS',    '1 L'),
  ('c1000000-0000-0000-0000-000000000005', 'Maggi 2-Minute Noodles',      'Maggi',      'GROCERY', '280 g'),
  ('c1000000-0000-0000-0000-000000000006', 'Tata Tea Gold',               'Tata Tea',   'GROCERY', '250 g'),
  ('c1000000-0000-0000-0000-000000000007', 'Madhur Pure Sugar',           'Madhur',     'GROCERY', '1 kg'),
  ('c1000000-0000-0000-0000-000000000008', 'Tata Sampann Toor Dal',       'Tata Sampann','GRAINS', '1 kg'),
  ('c1000000-0000-0000-0000-000000000009', 'Parle-G Biscuits',            'Parle',      'GROCERY', '800 g'),
  ('c1000000-0000-0000-0000-00000000000a', 'Surf Excel Easy Wash',        'Surf Excel', 'GROCERY', '1 kg')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
--  Seed 3 kirana stores (2 in the same district → "in your district"
--  competition, 1 elsewhere) so the buy-box has real rival offers.
--  profile_id NULL = demo store not tied to an auth user, like seed sellers.
--  Villages a0…001 = Kangra (HP), a0…004 = Nainital (UK) come from
--  location_and_collectives.sql.
-- ════════════════════════════════════════════════════════════
INSERT INTO sellers (id, profile_id, village_id, type, name, tagline, village, region, verified, rating, review_count, status) VALUES
  ('d1000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000001', 'KIRANA_STORE', 'Sharma Kirana Store',   'Your trusted neighbourhood store',  'Kangra',   'Himachal Pradesh', true, 4.6, 82, 'ACTIVE'),
  ('d1000000-0000-0000-0000-000000000002', NULL, 'a0000000-0000-0000-0000-000000000001', 'KIRANA_STORE', 'Verma General Store',   'Daily needs, delivered fast',       'Kangra',   'Himachal Pradesh', true, 4.3, 51, 'ACTIVE'),
  ('d1000000-0000-0000-0000-000000000003', NULL, 'a0000000-0000-0000-0000-000000000004', 'KIRANA_STORE', 'Nainital Provision Store','Hill-town groceries since 1998',   'Nainital', 'Uttarakhand',      true, 4.5, 37, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
--  Seed offers = products rows with catalog_item_id set. Same SKU sold by
--  several stores at DIFFERENT prices — this is the whole point.
--  name/unit/category are copied from the catalogue item at listing time.
-- ════════════════════════════════════════════════════════════
INSERT INTO products (id, seller_id, catalog_item_id, name, price, currency, unit, category, status, stock, traceable) VALUES
  -- Tata Salt 1kg — three stores compete
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Tata Salt', 22, 'INR', '1 kg', 'GROCERY', 'LIVE', 120, false),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Tata Salt', 24, 'INR', '1 kg', 'GROCERY', 'LIVE',  60, false),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Tata Salt', 25, 'INR', '1 kg', 'GROCERY', 'LIVE',  40, false),
  -- Aashirvaad Atta 5kg — two stores
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Aashirvaad Superior MP Atta', 275, 'INR', '5 kg', 'GRAINS', 'LIVE', 30, false),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Aashirvaad Superior MP Atta', 270, 'INR', '5 kg', 'GRAINS', 'LIVE', 25, false),
  -- Amul Milk 500ml — two stores (one in another district)
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Amul Gold Full Cream Milk', 27, 'INR', '500 ml', 'DAIRY', 'LIVE', 80, false),
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'Amul Gold Full Cream Milk', 28, 'INR', '500 ml', 'DAIRY', 'LIVE', 50, false),
  -- Fortune Oil 1L — two stores
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', 'Fortune Sunlite Sunflower Oil', 145, 'INR', '1 L', 'OILS', 'LIVE', 40, false),
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'Fortune Sunlite Sunflower Oil', 150, 'INR', '1 L', 'OILS', 'LIVE', 35, false),
  -- Maggi — two stores
  ('e1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Maggi 2-Minute Noodles', 42, 'INR', '280 g', 'GROCERY', 'LIVE', 100, false),
  ('e1000000-0000-0000-0000-00000000000b', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 'Maggi 2-Minute Noodles', 43, 'INR', '280 g', 'GROCERY', 'LIVE',  90, false),
  -- Single-store items (still catalogue-linked, just no rival yet)
  ('e1000000-0000-0000-0000-00000000000c', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'Tata Tea Gold', 135, 'INR', '250 g', 'GROCERY', 'LIVE', 45, false),
  ('e1000000-0000-0000-0000-00000000000d', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007', 'Madhur Pure Sugar', 48, 'INR', '1 kg', 'GROCERY', 'LIVE', 70, false),
  ('e1000000-0000-0000-0000-00000000000e', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000009', 'Parle-G Biscuits', 85, 'INR', '800 g', 'GROCERY', 'LIVE', 60, false)
ON CONFLICT (id) DO NOTHING;
