-- Supabase Storage Setup for Image Uploads
-- Run this in Supabase SQL Editor after creating the storage bucket

-- Create storage bucket for event images
-- Note: You need to create the bucket manually in Supabase Dashboard > Storage
-- Then run this to set up policies

-- Policy: Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Policy: Allow public read access
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Policy: Allow admins to update/delete
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images');

CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');

