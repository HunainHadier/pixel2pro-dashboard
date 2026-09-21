-- Migration: IT Students & Professionals discount (per course)
-- Run once in Supabase Dashboard -> SQL Editor. Idempotent — safe to run again.
--
-- Adds two columns on public.courses so the admin dashboard can configure the
-- "Discount For IT Students & Professionals" offer shown in the website enroll modal:
--   it_discount_monthly_fee      (e.g. 4500 — discounted monthly fee)
--   it_discount_registration_fee (e.g. 3000 — discounted registration fee)
--
-- Default discount policy (all programs): Monthly fee 4,500 | Registration fee 3,000

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS it_discount_monthly_fee numeric,
  ADD COLUMN IF NOT EXISTS it_discount_registration_fee numeric;

UPDATE public.courses SET
  it_discount_monthly_fee = 4500,
  it_discount_registration_fee = 3000
WHERE it_discount_monthly_fee IS NULL OR it_discount_registration_fee IS NULL;