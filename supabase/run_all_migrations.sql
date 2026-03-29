-- ============================================================
-- CONSOLIDATED MIGRATION — run this in Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New query → Paste & Run
-- ============================================================

-- 1. Accommodation location & contact fields
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS map_url TEXT;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Additional notes field on events (displayed above invitation text on home page)
ALTER TABLE events ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- 3. Accommodation auth control on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS accommodation_auth_required BOOLEAN DEFAULT true;

-- 3. Configurable RSVP response options on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_options JSONB DEFAULT NULL;

-- 4. Q&A feature toggle on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS qa_enabled BOOLEAN DEFAULT false;

-- 5. Q&A items table
CREATE TABLE IF NOT EXISTS qa_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_items_event_id ON qa_items(event_id);

-- Only create trigger if the update_updated_at_column function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_qa_items_updated_at'
    ) THEN
      CREATE TRIGGER update_qa_items_updated_at
        BEFORE UPDATE ON qa_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END
$$;
