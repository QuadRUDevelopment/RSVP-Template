-- Banner Text Styling Settings
-- Adds customizable styling options for banner text

ALTER TABLE events
ADD COLUMN IF NOT EXISTS banner_text_font_size INTEGER DEFAULT 64, -- in pixels (4rem = 64px)
ADD COLUMN IF NOT EXISTS banner_text_color TEXT DEFAULT '#ffffff', -- hex color
ADD COLUMN IF NOT EXISTS banner_text_shadow_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_text_shadow_x INTEGER DEFAULT 2, -- horizontal offset in pixels
ADD COLUMN IF NOT EXISTS banner_text_shadow_y INTEGER DEFAULT 2, -- vertical offset in pixels
ADD COLUMN IF NOT EXISTS banner_text_shadow_blur INTEGER DEFAULT 4, -- blur radius in pixels
ADD COLUMN IF NOT EXISTS banner_text_shadow_color TEXT DEFAULT 'rgba(0, 0, 0, 0.5)', -- shadow color
ADD COLUMN IF NOT EXISTS banner_text_border_enabled BOOLEAN DEFAULT false, -- enable border
ADD COLUMN IF NOT EXISTS banner_text_border_width INTEGER DEFAULT 2, -- border width in pixels
ADD COLUMN IF NOT EXISTS banner_text_border_color TEXT DEFAULT '#ffffff', -- border color (hex)
ADD COLUMN IF NOT EXISTS banner_text_border_opacity NUMERIC DEFAULT 1.0, -- border opacity 0.0-1.0
ADD COLUMN IF NOT EXISTS banner_text_border_radius INTEGER DEFAULT 8, -- border radius in pixels
ADD COLUMN IF NOT EXISTS banner_text_background_enabled BOOLEAN DEFAULT false, -- enable background
ADD COLUMN IF NOT EXISTS banner_text_background_color TEXT DEFAULT '#000000', -- background color (hex)
ADD COLUMN IF NOT EXISTS banner_text_background_opacity NUMERIC DEFAULT 0.5, -- background opacity 0.0-1.0
ADD COLUMN IF NOT EXISTS banner_text_padding INTEGER DEFAULT 16; -- padding in pixels between border and text

