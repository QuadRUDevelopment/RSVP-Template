-- Add accommodation auth toggle to events table
-- When true (default): guests must enter name/surname to see accommodations
-- When false: all 'all' group accommodations are shown publicly without login
ALTER TABLE events ADD COLUMN IF NOT EXISTS accommodation_auth_required BOOLEAN DEFAULT true;
