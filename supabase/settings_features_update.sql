-- Add feature toggles and wedding date to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS menu_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wedding_date TIMESTAMPTZ;

