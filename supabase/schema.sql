-- ============================================================
--  BazaarGrid — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
--  PROFILES  (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role        TEXT NOT NULL DEFAULT 'BUYER'
                CHECK (role IN ('BUYER','PRODUCER','VILLAGE_ADMIN','OPERATOR')),
  status      TEXT NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','PENDING','SUSPENDED')),
  name        TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bypass-RLS helper — runs as superuser so it never triggers policies recursively
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own"         ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"         ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"         ON profiles FOR UPDATE USING (auth.uid() = id);
-- Uses get_my_role() to avoid infinite recursion (policy querying the same table)
CREATE POLICY "operators_see_all_profiles"  ON profiles FOR SELECT USING (public.get_my_role() = 'OPERATOR');

-- Auto-create profile on signup
-- search_path='' forces explicit schema refs; required for SECURITY DEFINER triggers on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, status)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'BUYER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
--  VILLAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS villages (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               TEXT NOT NULL,
  region             TEXT,
  description        TEXT,
  status             TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PENDING')),
  traceability_score INT  DEFAULT 0,
  producer_count     INT  DEFAULT 0,
  product_count      INT  DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "villages_public_read"   ON villages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "villages_operator_all"  ON villages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'OPERATOR'));

-- ============================================================
--  SELLERS (Producers)
-- ============================================================
CREATE TABLE IF NOT EXISTS sellers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  village_id         UUID REFERENCES villages(id),
  type               TEXT DEFAULT 'VILLAGE_PRODUCER'
                       CHECK (type IN ('VILLAGE_PRODUCER','KIRANA_STORE')),
  name               TEXT NOT NULL,
  tagline            TEXT,
  story              TEXT,
  village            TEXT,
  region             TEXT,
  phone              TEXT,
  email              TEXT,
  verified           BOOLEAN DEFAULT false,
  traceability_score INT     DEFAULT 0,
  rating             NUMERIC(3,2) DEFAULT 0,
  review_count       INT     DEFAULT 0,
  product_count      INT     DEFAULT 0,
  member_since       DATE    DEFAULT CURRENT_DATE,
  avatar_url         TEXT,
  banner_url         TEXT,
  brand_accents      TEXT[]  DEFAULT '{}',
  status             TEXT    DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PENDING','SUSPENDED')),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellers_public_read"     ON sellers FOR SELECT TO anon, authenticated USING (status = 'ACTIVE');
CREATE POLICY "sellers_own_read"        ON sellers FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "sellers_own_update"      ON sellers FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "operators_sellers_all"   ON sellers FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('OPERATOR')));
CREATE POLICY "vadmin_sellers_read"     ON sellers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'VILLAGE_ADMIN'));

-- ============================================================
--  PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id    UUID REFERENCES sellers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  story        TEXT,
  price        NUMERIC(10,2) NOT NULL,
  currency     TEXT DEFAULT 'INR',
  unit         TEXT,
  category     TEXT DEFAULT 'OTHER',
  status       TEXT DEFAULT 'DRAFT'
                 CHECK (status IN ('LIVE','DRAFT','PENDING_APPROVAL')),
  stock        INT  DEFAULT 0,
  traceable    BOOLEAN DEFAULT false,
  organic      BOOLEAN DEFAULT false,
  batch_id     TEXT,
  tags         TEXT[] DEFAULT '{}',
  images       TEXT[] DEFAULT '{}',
  rating       NUMERIC(3,2) DEFAULT 0,
  review_count INT    DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_live"    ON products FOR SELECT TO anon, authenticated USING (status = 'LIVE');
CREATE POLICY "products_seller_all"     ON products FOR ALL    TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));
CREATE POLICY "products_admin_read"     ON products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('OPERATOR','VILLAGE_ADMIN')));

-- ============================================================
--  ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT DEFAULT 'Home',
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT,
  region      TEXT,
  postal_code TEXT,
  country     TEXT DEFAULT 'India',
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_own"  ON addresses FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
--  ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,   -- BG-XXXX format
  buyer_id         UUID REFERENCES profiles(id),
  seller_id        UUID REFERENCES sellers(id),
  status           TEXT DEFAULT 'PLACED'
                     CHECK (status IN ('PLACED','CONFIRMED','PACKED','FULFILLED','COMPLETED','CANCELLED')),
  channel          TEXT DEFAULT 'APP' CHECK (channel IN ('APP','WHATSAPP')),
  subtotal         NUMERIC(10,2),
  delivery_fee     NUMERIC(10,2) DEFAULT 0,
  rewards_discount NUMERIC(10,2) DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  fulfillment      TEXT DEFAULT 'DELIVERY' CHECK (fulfillment IN ('DELIVERY','PICKUP')),
  delivery_address JSONB,
  placed_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_buyer_read"    ON orders FOR SELECT    TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "orders_buyer_insert"  ON orders FOR INSERT    TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_seller_read"   ON orders FOR SELECT    TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));
CREATE POLICY "orders_seller_update" ON orders FOR UPDATE    TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));
CREATE POLICY "orders_operator_all"  ON orders FOR SELECT    TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'OPERATOR'));

-- ============================================================
--  ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  seller_id   UUID REFERENCES sellers(id),
  name        TEXT NOT NULL,
  unit        TEXT,
  quantity    INT  NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL,
  traceable   BOOLEAN DEFAULT false,
  batch_id    TEXT,
  image_url   TEXT
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_read" ON order_items FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
    OR seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'OPERATOR')
  );
CREATE POLICY "order_items_insert" ON order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid()));

-- ============================================================
--  REWARD TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reward_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('EARN','REDEEM')),
  points      INT  NOT NULL,
  description TEXT,
  order_id    TEXT REFERENCES orders(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_own_read"   ON reward_transactions FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "rewards_own_insert" ON reward_transactions FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- Computed balance view
CREATE OR REPLACE VIEW reward_balances AS
SELECT
  profile_id,
  COALESCE(SUM(CASE WHEN type = 'EARN' THEN points ELSE -points END), 0) AS balance
FROM reward_transactions
GROUP BY profile_id;

-- ============================================================
--  PAYMENT METHODS  (tokenised — no real card data)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT DEFAULT 'CARD' CHECK (type IN ('CARD','UPI','NETBANKING')),
  label       TEXT,
  last_four   TEXT,
  brand       TEXT,
  upi_id      TEXT,
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods_own" ON payment_methods FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
--  CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  village_id  UUID REFERENCES villages(id),
  title       TEXT NOT NULL,
  type        TEXT DEFAULT 'PROMO',
  audience    TEXT,
  start_date  DATE,
  end_date    DATE,
  description TEXT,
  status      TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('ACTIVE','SCHEDULED','ENDED')),
  reach       INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_public_read"  ON campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "campaigns_vadmin_write" ON campaigns FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('VILLAGE_ADMIN','OPERATOR')));

-- ============================================================
--  CERTIFICATIONS  (per-seller badges)
-- ============================================================
CREATE TABLE IF NOT EXISTS certifications (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  label     TEXT NOT NULL,
  icon      TEXT
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs_public_read" ON certifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "certs_seller_all"  ON certifications FOR ALL    TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE profile_id = auth.uid()));

-- ============================================================
--  SEED DATA
--  Fixed UUIDs so FK references are stable across re-runs.
-- ============================================================

-- Villages ───────────────────────────────────────────────────
INSERT INTO villages (id, name, region, description, status, traceability_score, producer_count, product_count)
VALUES
  ('a0000000-0000-0000-0000-000000000001','Green Valley',    'Himachal Pradesh',  'High-altitude valley famous for wildflower honey and cold-pressed oils.',       'ACTIVE', 94, 4, 18),
  ('a0000000-0000-0000-0000-000000000002','Coastal Harvest', 'Goa',               'Coastal collective of artisan producers specialising in sea-inspired crafts.',   'ACTIVE', 87, 3, 12),
  ('a0000000-0000-0000-0000-000000000003','Desert Rose',     'Rajasthan',         'Arid landscape yielding textiles, spices, and pottery with centuries of craft.', 'ACTIVE', 91, 5, 22),
  ('a0000000-0000-0000-0000-000000000004','Hill Top Crafts', 'Uttarakhand',       'Mountain artisans crafting handmade goods from locally-sourced materials.',      'ACTIVE', 78, 2,  9),
  ('a0000000-0000-0000-0000-000000000005','Deccan Spices',   'Andhra Pradesh',    'Premium spice collections from the Deccan plateau — onboarding in progress.',   'PENDING',  0, 0,  0)
ON CONFLICT (id) DO NOTHING;

-- Sellers ────────────────────────────────────────────────────
INSERT INTO sellers (id, village_id, type, name, tagline, story, village, region, phone, email, verified, traceability_score, rating, review_count, product_count, member_since, brand_accents, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','VILLAGE_PRODUCER',
   'Green Valley Farm','Wildflower honey & cold-pressed oils',
   'For four generations the Vance family has tended the wildflower meadows above Green Valley. Every jar is small-batch, raw and traceable from hive to home.',
   'Green Valley','Northern Highlands','15551234001','hello@greenvalley.example',
   true, 98, 4.8, 214, 12, '2022-03-01', ARRAY['#9d3d2e','#48654e','#7c5800'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','VILLAGE_PRODUCER',
   'Old Oak Mill','Stone-milled grains & heritage olive oil',
   'Old Oak Mill still turns on water and patience. We stone-mill ancient grains and cold-press olives within hours of harvest.',
   'Val di Sole','Heritage Valley','15551234002','mill@oldoak.example',
   true, 95, 4.7, 156, 9, '2021-09-14', ARRAY['#7c5800','#48654e','#9d3d2e'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002','VILLAGE_PRODUCER',
   'Coast Artisans Collective','Handmade coastal ceramics & sea salt',
   'A cooperative of eight potters and two salt harvesters who share a studio overlooking the estuary.',
   'Coastal Harvest','Southern Coast','15551234003','hello@coastartisans.example',
   true, 87, 4.6, 98, 8, '2023-01-20', ARRAY['#1a6b8a','#48654e','#7c5800'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003','VILLAGE_PRODUCER',
   'Desert Weavers Guild','Heritage block-print textiles & indigo',
   'The Guild has practiced resist-dyeing and block printing for 14 generations in the Thar desert.',
   'Desert Rose','Rajasthan','15551234004','guild@desertweavers.example',
   true, 91, 4.9, 312, 14, '2020-06-15', ARRAY['#7c5800','#9d3d2e','#1a6b8a'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000004','KIRANA_STORE',
   'Mountain Kirana','Your neighbourhood hill-station general store',
   'Supplying the Uttarakhand hills with essential goods and local produce since 1987.',
   'Hill Top Crafts','Uttarakhand','15551234005','store@mountainkirana.example',
   false, 78, 4.3, 44, 22, '2023-08-01', ARRAY['#48654e','#7c5800'], 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Certifications ─────────────────────────────────────────────
INSERT INTO certifications (seller_id, label, icon) VALUES
  ('b0000000-0000-0000-0000-000000000001','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000001','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000001','Organic Certified','eco'),
  ('b0000000-0000-0000-0000-000000000002','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000002','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000003','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000003','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000004','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000004','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000004','Heritage Craft','handshake');

-- Products ───────────────────────────────────────────────────
INSERT INTO products (id, seller_id, name, description, story, price, currency, unit, category, status, stock, traceable, organic, batch_id, tags, rating, review_count)
VALUES
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
   'Artisan Forest Honey','Raw, unfiltered wildflower honey gathered from high-meadow hives.',
   'Hand-extracted from wild hives in the Oakridge Forest perimeter, cold-filtered to preserve active enzymes and floral notes.',
   12.50,'INR','500g jar','HONEY','LIVE',64,true,true,'BG-2024-AFH-082',ARRAY['Organic','Raw','Small Batch'],4.9,128),

  ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001',
   'Cold-Pressed Sunflower Oil','Single-origin cold-pressed sunflower oil.',
   'Pressed in small batches from seeds grown in our own valley. No heat, no refinement — just pure flavour.',
   9.00,'INR','1L bottle','OILS','LIVE',32,true,true,'BG-2024-CSO-019',ARRAY['Cold-Pressed','Single Origin'],4.6,54),

  ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002',
   'Hand-Pressed Cold Olive Oil','First cold-pressed extra-virgin olive oil from heritage groves.',
   'Olives are picked by hand and pressed within four hours of harvest under the heritage hammer.',
   24.00,'INR','750ml bottle','OILS','LIVE',40,true,true,'BG-2024-OO-191',ARRAY['Cold-Pressed','Heritage','Single Origin'],4.8,86),

  ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000002',
   'Heritage Wheat Flour','Stone-milled whole-wheat flour from ancient grain varieties.',
   'Ground on the same millstone our great-grandfather set in 1923.',
   6.50,'INR','2kg bag','GRAINS','LIVE',120,false,true,'BG-2024-HWF-007',ARRAY['Stone-Milled','Ancient Grain'],4.5,41),

  ('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000003',
   'Oceanic Swirl Serving Bowl','Hand-thrown stoneware bowl with a coastal swirl glaze.',
   'Thrown on the wheel and glazed with a coastal swirl drawn from saltmarsh blues — each piece is one of a kind.',
   32.00,'INR','each','POTTERY','LIVE',18,true,false,'BG-2024-OSB-044',ARRAY['Handmade','Stoneware','Food-Safe'],4.7,37),

  ('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000003',
   'Fleur de Sel Sea Salt','Hand-harvested fleur de sel from Atlantic tidal pools.',
   'Raked at dawn during spring tides when the crystal formation is at its finest.',
   14.00,'INR','200g tin','SPICES','LIVE',55,false,false,'BG-2024-FDS-033',ARRAY['Hand-Harvested','Artisan'],4.8,62),

  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000004',
   'Indigo Block-Print Tablecloth','Heritage block-print tablecloth in natural indigo dye.',
   'Printed by master block-printers using 200-year-old carved teak blocks. Indigo-dyed in open vats under the Rajasthan sun.',
   48.00,'INR','150×240cm','TEXTILES','LIVE',12,true,false,'BG-2024-IBT-021',ARRAY['Handmade','Heritage','Natural Dye'],4.9,89),

  ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000004',
   'Natural Indigo Kurta','Hand-block-printed cotton kurta in natural indigo.',
   'Tailored from hand-woven cotton and block-printed in our 14th-generation dye house.',
   38.00,'INR','M/L/XL','TEXTILES','LIVE',25,false,true,'BG-2024-NIK-015',ARRAY['Handmade','Natural Dye','Wearable Art'],4.7,55),

  ('c0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000005',
   'Pahadi Rajma (Red Kidney Beans)','Small-batch mountain-grown kidney beans.',
   'Slow-grown at altitude in Uttarakhand with no pesticides. Famous for their nutty, earthy taste.',
   5.50,'INR','500g pack','GRAINS','LIVE',200,false,true,NULL,ARRAY['Organic','Mountain Grown'],4.4,28),

  ('c0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000005',
   'Hill Station Mixed Spice Box','A curated box of six Uttarakhand spices.',
   'Sourced from altitude farms: Timur pepper, turmeric, cumin, coriander, ajwain, and dried ginger.',
   18.00,'INR','6-spice box','SPICES','LIVE',45,false,false,NULL,ARRAY['Curated','Gift-Ready'],4.6,33)
ON CONFLICT (id) DO NOTHING;

-- Campaigns ──────────────────────────────────────────────────
INSERT INTO campaigns (village_id, title, type, audience, start_date, end_date, description, status, reach)
VALUES
  ('a0000000-0000-0000-0000-000000000001','Harvest Festival Double Tokens','PROMO','All buyers',    '2026-07-01','2026-07-15','Earn 2× reward tokens on every purchase during the Harvest Festival.',              'SCHEDULED',0),
  ('a0000000-0000-0000-0000-000000000002','Monsoon Coastal Collection',    'LAUNCH','New buyers',   '2026-06-01','2026-06-30','New glazes inspired by the monsoon season — ceramics and sea salt kits.',            'ACTIVE',   840),
  ('a0000000-0000-0000-0000-000000000003','Block-Print Summer Festival',   'EVENT', 'Returning',    '2026-05-15','2026-05-31','Live block-printing sessions and early access to the summer collection.',            'ENDED',    2100);
