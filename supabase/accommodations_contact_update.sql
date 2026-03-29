-- Add location and contact fields to accommodations table
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS map_url TEXT;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS email TEXT;
