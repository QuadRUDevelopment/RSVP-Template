-- Add social sharing image field to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS social_sharing_image_url TEXT;

