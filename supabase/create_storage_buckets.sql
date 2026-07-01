-- Create public storage buckets for images
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('dogs',    'dogs',    true),
  ('walks',   'walks',   true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to any of these buckets
CREATE POLICY "Auth users can upload images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'dogs', 'walks'));

-- Allow authenticated users to overwrite their own files
CREATE POLICY "Auth users can update images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars', 'dogs', 'walks'));

-- Allow anyone to read (buckets are public, but policy still needed for SELECT)
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'dogs', 'walks'));
