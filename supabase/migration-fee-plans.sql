-- Migration: New fee structure (fee policy)
-- Run once in Supabase Dashboard -> SQL Editor. Idempotent — safe to run again.
-- Adds a fee_plans column (used by the admin dashboard to store payment options)
-- and updates the base fee columns to the current fee policy.
--
-- Fee policy (all programs):
--   Monthly fee 5,000 | Admission fee 5,000
--   Next-Gen Developer (4 mo):  lump-sum 16,000 (reg 0) | 2 installments 18,000 (reg 2,000)
--   AI Foundation & Freelancing (2 mo): lump-sum 8,000 (reg 0)
--   Digital Marketing (3 mo):    lump-sum 12,000 (reg 0) | 2 installments 16,000 (reg 2,000)
--   Shopify (2 mo):              lump-sum 8,000 (reg 0)

-- 1) New columns
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS fee_plans jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS fee_plan_id text;

-- 1b) Allow all payment types used by the new fee structure.
-- The original constraint (migration-v2) only allowed 'admission' and 'monthly',
-- which made installment / one-time payments fail with:
--   new row for relation "payments" violates check constraint "payments_payment_type_check"
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('admission', 'monthly', 'installment', 'one-time'));

-- 2) Base fee columns -> current policy
UPDATE public.courses SET
  monthly_fee = 5000,
  admission_fee = 5000,
  price = CASE course_name
    WHEN 'Next-Gen Developer: AI Coding & Vibe Coding' THEN 16000
    WHEN 'AI Foundation & Freelancing' THEN 8000
    WHEN 'Digital Marketing Mastery Program' THEN 12000
    WHEN 'Shopify Store Development & Management' THEN 8000
    ELSE price
  END;

-- 3) Seed payment options per course
UPDATE public.courses SET fee_plans = '[
  { "id": "monthly", "type": "monthly", "title": "Monthly Fee", "totalFee": 25000, "registrationFee": 5000, "monthlyFee": 5000, "months": 4 },
  { "id": "lump-sum", "type": "lump-sum", "title": "One-Time Payment", "totalFee": 16000, "registrationFee": 0, "badge": "Best Value", "note": "No registration fee" },
  { "id": "installment", "type": "installment", "title": "2 Installments", "totalFee": 18000, "registrationFee": 2000, "badge": "Flexible", "installments": [
      { "label": "Before course starts", "amount": 10000, "note": "Course fee 8,000 + registration 2,000" },
      { "label": "Start of 2nd month", "amount": 8000 }
  ] }
]'::jsonb WHERE course_name = 'Next-Gen Developer: AI Coding & Vibe Coding';

UPDATE public.courses SET fee_plans = '[
  { "id": "monthly", "type": "monthly", "title": "Monthly Fee", "totalFee": 15000, "registrationFee": 5000, "monthlyFee": 5000, "months": 2 },
  { "id": "lump-sum", "type": "lump-sum", "title": "One-Time Payment", "totalFee": 8000, "registrationFee": 0, "badge": "Best Value", "note": "No registration fee" }
]'::jsonb WHERE course_name = 'AI Foundation & Freelancing';

UPDATE public.courses SET fee_plans = '[
  { "id": "monthly", "type": "monthly", "title": "Monthly Fee", "totalFee": 20000, "registrationFee": 5000, "monthlyFee": 5000, "months": 3 },
  { "id": "lump-sum", "type": "lump-sum", "title": "One-Time Payment", "totalFee": 12000, "registrationFee": 0, "badge": "Best Value", "note": "No registration fee" },
  { "id": "installment", "type": "installment", "title": "2 Installments", "totalFee": 16000, "registrationFee": 2000, "badge": "Flexible", "installments": [
      { "label": "Before course starts", "amount": 9000 },
      { "label": "Start of 2nd month", "amount": 7000 }
  ] }
]'::jsonb WHERE course_name = 'Digital Marketing Mastery Program';

UPDATE public.courses SET fee_plans = '[
  { "id": "monthly", "type": "monthly", "title": "Monthly Fee", "totalFee": 15000, "registrationFee": 5000, "monthlyFee": 5000, "months": 2 },
  { "id": "lump-sum", "type": "lump-sum", "title": "One-Time Payment", "totalFee": 8000, "registrationFee": 0, "badge": "Best Value", "note": "No registration fee" }
]'::jsonb WHERE course_name = 'Shopify Store Development & Management';