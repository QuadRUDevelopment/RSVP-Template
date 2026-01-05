-- Add site general settings to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS site_name TEXT,
ADD COLUMN IF NOT EXISTS site_icon_url TEXT;

