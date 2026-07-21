-- BazaarGrid — Location (state/district) + FPO/SHG seller types.
-- Run in Supabase SQL Editor after schema.sql + fixes.sql. Safe to re-run.

-- ════════════════════════════════════════════════════════════
--  Location columns
-- ════════════════════════════════════════════════════════════

ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS state    TEXT;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS district TEXT;

ALTER TABLE villages   ADD COLUMN IF NOT EXISTS state    TEXT;
ALTER TABLE villages   ADD COLUMN IF NOT EXISTS district TEXT;

ALTER TABLE addresses  ADD COLUMN IF NOT EXISTS district TEXT;

-- Backfill state/district for the 5 seed villages so the demo has real data
UPDATE villages SET state = 'Himachal Pradesh', district = 'Kangra'        WHERE id = 'a0000000-0000-0000-0000-000000000001' AND state IS NULL;
UPDATE villages SET state = 'Goa',               district = 'North Goa'    WHERE id = 'a0000000-0000-0000-0000-000000000002' AND state IS NULL;
UPDATE villages SET state = 'Rajasthan',         district = 'Jodhpur'      WHERE id = 'a0000000-0000-0000-0000-000000000003' AND state IS NULL;
UPDATE villages SET state = 'Uttarakhand',       district = 'Nainital'     WHERE id = 'a0000000-0000-0000-0000-000000000004' AND state IS NULL;
UPDATE villages SET state = 'Andhra Pradesh',    district = 'Visakhapatnam' WHERE id = 'a0000000-0000-0000-0000-000000000005' AND state IS NULL;

-- ════════════════════════════════════════════════════════════
--  Seller type: FPOs and SHGs are sellers (like village producers
--  and kirana stores) — same catalogue/orders/analytics machinery,
--  no separate architecture. They still belong to a village via
--  sellers.village_id, same as any producer.
-- ════════════════════════════════════════════════════════════

ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_type_check;
ALTER TABLE sellers ADD CONSTRAINT sellers_type_check
  CHECK (type IN ('VILLAGE_PRODUCER','KIRANA_STORE','FPO','SHG'));

-- Optional member count, shown on FPO/SHG storefronts ("42 farmer members")
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS member_count INT;
