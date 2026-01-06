-- Add accommodation_enabled feature toggle to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS accommodation_enabled BOOLEAN DEFAULT true;

