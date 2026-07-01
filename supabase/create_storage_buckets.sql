-- Create public storage buckets for images
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('dogs',    'dogs',    true),
  ('walks',   'walks',   true)
ON CONFLICT (id) DO NOTHING;

-- Drop old permissive policies if they exist from a previous run
DROP POLICY IF EXISTS "Auth users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public read images"           ON storage.objects;
DROP POLICY IF EXISTS "Users upload own images"      ON storage.objects;
DROP POLICY IF EXISTS "Users update own images"      ON storage.objects;
DROP POLICY IF EXISTS "Users delete own images"      ON storage.objects;

-- Upload: user must own the path (first folder segment = their uid)
-- and the file must be an image type.
CREATE POLICY "Users upload own images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars', 'dogs', 'walks')
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(name) ~ '\.(jpg|jpeg|png|webp|gif)$'
  );

-- Update: user must own the path before AND after the change.
CREATE POLICY "Users update own images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('avatars', 'dogs', 'walks')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'dogs', 'walks')
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(name) ~ '\.(jpg|jpeg|png|webp|gif)$'
  );

-- Delete: user can only remove files in their own folder.
CREATE POLICY "Users delete own images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('avatars', 'dogs', 'walks')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read: buckets are public, but a SELECT policy is still required.
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'dogs', 'walks'));
