-- Q&A / FAQ Section Schema

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

CREATE TRIGGER update_qa_items_updated_at BEFORE UPDATE ON qa_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add qa_enabled feature toggle to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS qa_enabled BOOLEAN DEFAULT false;
