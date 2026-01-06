-- Gallery Carousel Speed Setting
-- Adds configurable auto-rotation speed for gallery carousel

ALTER TABLE events
ADD COLUMN IF NOT EXISTS gallery_carousel_speed INTEGER DEFAULT 3000; -- rotation speed in milliseconds (default: 3 seconds)

