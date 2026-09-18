-- Migration v10: Supabase Storage bucket for testimonial videos and thumbnails.
-- Run in Supabase Dashboard -> SQL Editor.
-- NOTE: You must also create the "testimonials" bucket in Storage UI
--   (Storage > New bucket > name: testimonials, Public: yes, File size limit: 50 MB).

-- Add student_avatar column to feedbacks (used by admin review cards).
ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS student_avatar text DEFAULT NULL;

-- Allow public read access to testimonial media.
CREATE POLICY "Public read access for testimonials"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'testimonials');

-- Allow authenticated uploads to the testimonials bucket.
CREATE POLICY "Authenticated can upload to testimonials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'testimonials');

-- Allow anon (API key) uploads to the testimonials bucket.
CREATE POLICY "Anon can upload to testimonials"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'testimonials');

-- Allow authenticated deletes from the testimonials bucket.
CREATE POLICY "Authenticated can delete from testimonials"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'testimonials');
