-- BazaarGrid — run in Supabase SQL Editor after schema.sql. Safe to re-run.

-- Orders: auto-generate id, add payment + promo columns
ALTER TABLE orders ALTER COLUMN id SET DEFAULT ('BG-' || upper(substr(md5(random()::text), 1, 6)));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'CARD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  code        TEXT PRIMARY KEY,
  percent_off INT NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  active      BOOLEAN DEFAULT true,
  min_order   NUMERIC(10,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promo_public_read ON promo_codes;
CREATE POLICY promo_public_read ON promo_codes FOR SELECT TO anon, authenticated USING (active);

INSERT INTO promo_codes (code, percent_off, min_order) VALUES
  ('BAZAAR10', 10, 0),
  ('HARVEST15', 15, 499),
  ('VILLAGE20', 20, 999)
ON CONFLICT (code) DO NOTHING;

-- Favorites (wishlist)
CREATE TABLE IF NOT EXISTS favorites (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, product_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS favorites_own ON favorites;
CREATE POLICY favorites_own ON favorites FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Auto-create a seller row when a producer is approved
CREATE OR REPLACE FUNCTION public.ensure_seller_for_producer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.role = 'PRODUCER' AND NEW.status = 'ACTIVE'
     AND NOT EXISTS (SELECT 1 FROM public.sellers WHERE profile_id = NEW.id) THEN
    INSERT INTO public.sellers (profile_id, type, name, tagline, status, verified, traceability_score, member_since)
    VALUES (NEW.id, 'VILLAGE_PRODUCER', COALESCE(NEW.name, 'New Producer'),
            'Heritage goods, direct from the source.', 'ACTIVE', false, 60, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_producer_approved ON profiles;
CREATE TRIGGER on_producer_approved
  AFTER INSERT OR UPDATE OF role, status ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_seller_for_producer();

-- Backfill sellers for any already-approved producers
INSERT INTO public.sellers (profile_id, type, name, tagline, status, verified, traceability_score, member_since)
SELECT p.id, 'VILLAGE_PRODUCER', COALESCE(p.name, 'New Producer'),
       'Heritage goods, direct from the source.', 'ACTIVE', false, 60, CURRENT_DATE
FROM profiles p
WHERE p.role = 'PRODUCER' AND p.status = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM sellers s WHERE s.profile_id = p.id);

-- Let village admins insert/update sellers in their scope
DROP POLICY IF EXISTS vadmin_sellers_write ON sellers;
CREATE POLICY vadmin_sellers_write ON sellers FOR ALL TO authenticated
  USING (public.get_my_role() = 'VILLAGE_ADMIN')
  WITH CHECK (public.get_my_role() = 'VILLAGE_ADMIN');

-- Backfill profiles for any auth users who don't have a row yet
-- (handles users who signed up before the handle_new_user trigger was fixed)
INSERT INTO public.profiles (id, name, role, status)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ),
  'BUYER',
  'ACTIVE'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
