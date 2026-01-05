-- Add location fields to accommodations table
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS map_url TEXT;

