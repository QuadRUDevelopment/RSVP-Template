-- Groups table for managing guest groups and audience types
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, key)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_groups_event_id ON groups(event_id);

-- Trigger for updated_at
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default groups for existing events
INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  id,
  'all',
  'All Guests',
  'Visible to all guests',
  0
FROM events
ON CONFLICT (event_id, key) DO NOTHING;

INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  id,
  'family',
  'Family',
  'Family members only',
  1
FROM events
ON CONFLICT (event_id, key) DO NOTHING;

INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  id,
  'friends',
  'Friends',
  'Friends only',
  2
FROM events
ON CONFLICT (event_id, key) DO NOTHING;

