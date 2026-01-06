-- Banner Text Styling Settings
-- Adds customizable styling options for banner text

ALTER TABLE events
ADD COLUMN IF NOT EXISTS banner_text_font_size INTEGER DEFAULT 64, -- in pixels (4rem = 64px)
ADD COLUMN IF NOT EXISTS banner_text_color TEXT DEFAULT '#ffffff', -- hex color
ADD COLUMN IF NOT EXISTS banner_text_shadow_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_text_shadow_x INTEGER DEFAULT 2, -- horizontal offset in pixels
ADD COLUMN IF NOT EXISTS banner_text_shadow_y INTEGER DEFAULT 2, -- vertical offset in pixels
ADD COLUMN IF NOT EXISTS banner_text_shadow_blur INTEGER DEFAULT 4, -- blur radius in pixels
ADD COLUMN IF NOT EXISTS banner_text_shadow_color TEXT DEFAULT 'rgba(0, 0, 0, 0.5)'; -- shadow color

