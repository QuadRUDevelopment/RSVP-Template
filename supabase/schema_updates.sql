-- Additional fields for story-based home page
ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_text TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS story_text TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS story_image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_message TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_map_url TEXT;

