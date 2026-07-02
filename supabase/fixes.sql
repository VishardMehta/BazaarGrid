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

-- ════════════════════════════════════════════════════════════
--  Village membership + producer approval flow
-- ════════════════════════════════════════════════════════════

-- Profiles: which village a producer / village admin belongs to
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES villages(id);

-- Producers create their own (PENDING) seller row during onboarding
DROP POLICY IF EXISTS sellers_own_insert ON sellers;
CREATE POLICY sellers_own_insert ON sellers FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Village admins can approve/reject producer products (set LIVE / DRAFT)
DROP POLICY IF EXISTS vadmin_products_update ON products;
CREATE POLICY vadmin_products_update ON products FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('VILLAGE_ADMIN','OPERATOR'))
  WITH CHECK (public.get_my_role() IN ('VILLAGE_ADMIN','OPERATOR'));

-- Approve a producer: activates BOTH the seller row and the linked profile.
-- SECURITY DEFINER because village admins can't update other users' profiles.
CREATE OR REPLACE FUNCTION public.approve_producer(p_seller_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_profile UUID;
BEGIN
  IF public.get_my_role() NOT IN ('VILLAGE_ADMIN','OPERATOR') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.sellers SET status = 'ACTIVE' WHERE id = p_seller_id
    RETURNING profile_id INTO v_profile;
  IF v_profile IS NOT NULL THEN
    UPDATE public.profiles SET status = 'ACTIVE', updated_at = NOW() WHERE id = v_profile;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_producer(p_seller_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_profile UUID;
BEGIN
  IF public.get_my_role() NOT IN ('VILLAGE_ADMIN','OPERATOR') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.sellers SET status = 'SUSPENDED' WHERE id = p_seller_id
    RETURNING profile_id INTO v_profile;
  IF v_profile IS NOT NULL THEN
    UPDATE public.profiles SET status = 'SUSPENDED', updated_at = NOW() WHERE id = v_profile;
  END IF;
END;
$$;

-- Producer-approval trigger now carries the chosen village onto the seller row
CREATE OR REPLACE FUNCTION public.ensure_seller_for_producer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.role = 'PRODUCER' AND NEW.status = 'ACTIVE'
     AND NOT EXISTS (SELECT 1 FROM public.sellers WHERE profile_id = NEW.id) THEN
    INSERT INTO public.sellers (profile_id, village_id, type, name, tagline, village, region, status, verified, traceability_score, member_since)
    SELECT NEW.id, NEW.village_id, 'VILLAGE_PRODUCER', COALESCE(NEW.name, 'New Producer'),
           'Heritage goods, direct from the source.', v.name, v.region, 'ACTIVE', false, 60, CURRENT_DATE
    FROM (SELECT 1) one
    LEFT JOIN public.villages v ON v.id = NEW.village_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill: pending producers who never got a seller row (so they show up
-- in the Village Admin pending-approvals list)
INSERT INTO public.sellers (profile_id, village_id, type, name, tagline, village, region, status, traceability_score, member_since)
SELECT p.id, p.village_id, 'VILLAGE_PRODUCER', COALESCE(p.name, 'New Producer'),
       'Heritage goods, direct from the source.', v.name, v.region, 'PENDING', 60, CURRENT_DATE
FROM public.profiles p
LEFT JOIN public.villages v ON v.id = p.village_id
WHERE p.role = 'PRODUCER' AND p.status = 'PENDING'
  AND NOT EXISTS (SELECT 1 FROM public.sellers s WHERE s.profile_id = p.id);

-- Backfill: give existing traceable products a batch id if missing
UPDATE public.products
SET batch_id = 'BG-' || to_char(created_at, 'YYYY') || '-' ||
               upper(substr(regexp_replace(name, '[^a-zA-Z]', '', 'g'), 1, 3)) || '-' ||
               upper(substr(md5(id::text), 1, 4))
WHERE traceable = true AND batch_id IS NULL;

-- ════════════════════════════════════════════════════════════
--  Harvest Tokens: earn on purchase (1 token per ₹10 spent)
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.earn_tokens_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE pts INT;
BEGIN
  pts := floor(NEW.total / 10);
  IF pts > 0 AND NEW.buyer_id IS NOT NULL THEN
    INSERT INTO public.reward_transactions (profile_id, type, points, description, order_id)
    VALUES (NEW.buyer_id, 'EARN', pts,
            'Order ' || NEW.id || ' (₹' || round(NEW.total) || ' spend)', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_earn_tokens ON orders;
CREATE TRIGGER on_order_earn_tokens
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.earn_tokens_on_order();

-- ════════════════════════════════════════════════════════════
--  Stock: decrement on purchase, restore on cancellation
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.decrement_stock_on_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock = GREATEST(stock - NEW.quantity, 0), updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_decrement_stock ON order_items;
CREATE TRIGGER on_order_item_decrement_stock
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_item();

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
    UPDATE public.products p
    SET stock = p.stock + oi.quantity, updated_at = NOW()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

    -- Claw back the tokens earned on this order
    IF NEW.buyer_id IS NOT NULL AND floor(NEW.total / 10) > 0 THEN
      INSERT INTO public.reward_transactions (profile_id, type, points, description, order_id)
      VALUES (NEW.buyer_id, 'REDEEM', floor(NEW.total / 10)::int,
              'Order ' || NEW.id || ' cancelled — earned tokens reversed', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Buyers may cancel their own order while it is still just PLACED
DROP POLICY IF EXISTS orders_buyer_cancel ON orders;
CREATE POLICY orders_buyer_cancel ON orders FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() AND status = 'PLACED')
  WITH CHECK (buyer_id = auth.uid());

DROP TRIGGER IF EXISTS on_order_cancel_restore_stock ON orders;
CREATE TRIGGER on_order_cancel_restore_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

-- ════════════════════════════════════════════════════════════
--  Product reviews (rate-this-order) + live rating aggregation
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id   TEXT REFERENCES orders(id) ON DELETE SET NULL,
  buyer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, order_id, buyer_id)
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_public_read ON product_reviews;
CREATE POLICY reviews_public_read ON product_reviews FOR SELECT TO anon, authenticated USING (true);
-- Buyers may only review items from their own COMPLETED orders
DROP POLICY IF EXISTS reviews_buyer_insert ON product_reviews;
CREATE POLICY reviews_buyer_insert ON product_reviews FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid() AND status = 'COMPLETED')
  );

-- Keep products.rating / review_count live (incremental average, preserves seed baseline)
CREATE OR REPLACE FUNCTION public.apply_review_to_product()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.products
  SET rating = round(((rating * review_count) + NEW.rating)::numeric / (review_count + 1), 2),
      review_count = review_count + 1,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_update_product ON product_reviews;
CREATE TRIGGER on_review_update_product
  AFTER INSERT ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.apply_review_to_product();

-- ════════════════════════════════════════════════════════════
--  Traceability score: computed, not random
--  seller score = 30 base
--               + 50 × (traceable live products / live products)
--               + 10 × (organic live products / live products)
--               + 10 if verified                      (capped 100)
--  village score = avg of its active sellers' scores
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recompute_seller_stats(p_seller_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  n_total INT; n_trace INT; n_organic INT; v_verified BOOLEAN; v_score INT;
BEGIN
  SELECT count(*) FILTER (WHERE status = 'LIVE'),
         count(*) FILTER (WHERE status = 'LIVE' AND traceable),
         count(*) FILTER (WHERE status = 'LIVE' AND organic)
  INTO n_total, n_trace, n_organic
  FROM public.products WHERE seller_id = p_seller_id;

  SELECT verified INTO v_verified FROM public.sellers WHERE id = p_seller_id;

  IF n_total = 0 THEN
    v_score := 30 + (CASE WHEN v_verified THEN 10 ELSE 0 END);
  ELSE
    v_score := LEAST(100, 30
      + round(50.0 * n_trace   / n_total)
      + round(10.0 * n_organic / n_total)
      + (CASE WHEN v_verified THEN 10 ELSE 0 END));
  END IF;

  UPDATE public.sellers
  SET product_count = n_total, traceability_score = v_score
  WHERE id = p_seller_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_product_change_recompute()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_seller_stats(OLD.seller_id);
    RETURN OLD;
  END IF;
  PERFORM public.recompute_seller_stats(NEW.seller_id);
  IF TG_OP = 'UPDATE' AND OLD.seller_id IS DISTINCT FROM NEW.seller_id THEN
    PERFORM public.recompute_seller_stats(OLD.seller_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_product_change_stats ON products;
CREATE TRIGGER on_product_change_stats
  AFTER INSERT OR UPDATE OF status, traceable, organic, seller_id OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION public.on_product_change_recompute();

-- Roll seller stats up to the village
CREATE OR REPLACE FUNCTION public.on_seller_change_recompute_village()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE vid UUID;
BEGIN
  vid := COALESCE(NEW.village_id, OLD.village_id);
  IF vid IS NOT NULL THEN
    UPDATE public.villages v
    SET producer_count     = s.n,
        product_count      = s.products,
        traceability_score = COALESCE(s.score, 0)
    FROM (
      SELECT count(*) AS n,
             COALESCE(sum(product_count), 0) AS products,
             round(avg(traceability_score)) AS score
      FROM public.sellers
      WHERE village_id = vid AND status = 'ACTIVE'
    ) s
    WHERE v.id = vid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_seller_change_village_stats ON sellers;
CREATE TRIGGER on_seller_change_village_stats
  AFTER INSERT OR UPDATE OF status, village_id, product_count, traceability_score OR DELETE ON sellers
  FOR EACH ROW EXECUTE FUNCTION public.on_seller_change_recompute_village();

-- One-time recompute for all existing sellers (also cascades to villages)
DO $$
DECLARE s RECORD;
BEGIN
  FOR s IN SELECT id FROM public.sellers LOOP
    PERFORM public.recompute_seller_stats(s.id);
  END LOOP;
END;
$$;
