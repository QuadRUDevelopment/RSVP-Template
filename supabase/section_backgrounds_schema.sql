-- Section Background Settings Schema
-- Allows per-section customization of backgrounds, colors, and overlays

ALTER TABLE events ADD COLUMN IF NOT EXISTS section_backgrounds JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "banner": {
--     "background_image_url": "https://...",
--     "background_color": "#ffffff",
--     "overlay_enabled": true,
--     "overlay_color": "#000000",
--     "overlay_opacity": 0.4
--   },
--   "story": { ... },
--   "venue": { ... },
--   "schedule": { ... },
--   "rsvp": { ... }
-- }

