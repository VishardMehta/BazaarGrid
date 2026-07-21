-- BazaarGrid — Razorpay payment tracking columns.
-- Run in Supabase SQL Editor after schema.sql + fixes.sql. Safe to re-run.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status    TEXT DEFAULT 'PENDING'
  CHECK (payment_status IN ('PENDING','PAID','FAILED'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
