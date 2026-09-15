-- Migration v2: New course fields, admission fee, payment slips, storage
-- Run in Supabase Dashboard → SQL Editor

-- 1. New course fields
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS classes_per_week integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS hours_per_class numeric NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS admission_fee numeric,
  ADD COLUMN IF NOT EXISTS monthly_fee numeric NOT NULL DEFAULT 0;

-- 2. Payment slip URL column
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS slip_url text,
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'monthly'
    CHECK (payment_type IN ('admission', 'monthly'));

-- 3. Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public)
  VALUES ('payment-slips', 'payment-slips', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow anon to upload
CREATE POLICY "Allow anon upload" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'payment-slips');

-- Storage policy: allow anon to read
CREATE POLICY "Allow anon read" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'payment-slips');
