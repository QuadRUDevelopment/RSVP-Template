-- Add configurable RSVP response options to events table
-- Format: {"yes": {"label": "Yes", "emoji": "🎉", "enabled": true}, "no": {...}, "maybe": {...}}
-- When null, the default yes/no/maybe options are used
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_options JSONB DEFAULT NULL;
