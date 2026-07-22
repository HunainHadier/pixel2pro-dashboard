-- Step 1: Drop old policies (run each line separately)
DROP POLICY IF EXISTS authenticated_admin_access ON public.courses;
DROP POLICY IF EXISTS authenticated_admin_access ON public.enrollments;
DROP POLICY IF EXISTS authenticated_admin_access ON public.payments;
DROP POLICY IF EXISTS authenticated_admin_access ON public.feedbacks;

-- Step 2: Create new policies for BOTH anon and authenticated roles
CREATE POLICY admin_full_access ON public.courses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access ON public.enrollments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access ON public.feedbacks FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY admin_full_access_auth ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access_auth ON public.enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access_auth ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_full_access_auth ON public.feedbacks FOR ALL TO authenticated USING (true) WITH CHECK (true);
