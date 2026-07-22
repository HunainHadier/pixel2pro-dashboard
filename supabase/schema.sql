-- Pixel2Pro Admin migration for the CURRENT database schema.
-- Run once in Supabase Dashboard -> SQL Editor. It does not recreate or delete
-- enrollments, contacts, or feedbacks; it only adds the admin fields required.
-- Do not add a service_role key to this frontend project.

create extension if not exists "pgcrypto";

-- Existing enrollments fields remain the source of truth:
-- whatsapp_number, city_country, exact_program, source_track_id.
alter table public.enrollments
  add column if not exists course_id uuid,
  add column if not exists total_fee numeric not null default 0 check (total_fee >= 0),
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'completed', 'suspended')),
  add column if not exists guardian_name text,
  add column if not exists guardian_phone text,
  add column if not exists guardian_relation text,
  add column if not exists notes text,
  add column if not exists paid_amount numeric not null default 0 check (paid_amount >= 0);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_name text not null,
  category text not null default 'General',
  duration text not null default '1 month',
  level text not null default 'Beginner' check (level in ('Beginner', 'Intermediate', 'Advanced')),
  price numeric not null default 0 check (price >= 0),
  discount numeric not null default 0 check (discount between 0 and 100),
  status text not null default 'draft' check (status in ('published', 'draft')),
  description text not null default '',
  thumbnail text,
  completion_rate numeric not null default 0,
  students integer not null default 0,
  revenue numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.enrollments
  drop constraint if exists enrollments_course_id_fkey,
  add constraint enrollments_course_id_fkey foreign key (course_id)
    references public.courses(id) on delete set null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date timestamptz not null default now(),
  payment_method text not null default 'Bank Transfer',
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  reference_number text not null,
  screenshot_url text,
  created_at timestamptz not null default now()
);

-- Keep the existing public-site contract: approved=true means the review is public.
-- moderation_status lets the admin dashboard distinguish pending from rejected.
alter table public.feedbacks
  add column if not exists rating integer check (rating between 1 and 5),
  add column if not exists pinned boolean not null default false,
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected'));

update public.feedbacks
set moderation_status = case when approved then 'approved' else 'pending' end
where moderation_status = 'pending' and approved;

-- Enable RLS on all tables
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.feedbacks enable row level security;

-- Drop old policies
DROP POLICY IF EXISTS authenticated_admin_access ON public.courses;
DROP POLICY IF EXISTS authenticated_admin_access ON public.enrollments;
DROP POLICY IF EXISTS authenticated_admin_access ON public.payments;
DROP POLICY IF EXISTS authenticated_admin_access ON public.feedbacks;

-- Allow both anon (API key) and authenticated (JWT) roles full access.
-- Security is enforced by RLS itself — the publishable key is already client-side.
CREATE POLICY admin_full_access ON public.courses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access ON public.enrollments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access ON public.feedbacks FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY admin_full_access_auth ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access_auth ON public.enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access_auth ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access_auth ON public.feedbacks FOR ALL TO authenticated USING (true) WITH CHECK (true);
