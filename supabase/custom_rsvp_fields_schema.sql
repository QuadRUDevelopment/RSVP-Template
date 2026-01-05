-- Custom RSVP Fields Schema
-- Allows admins to add custom fields to RSVP forms

-- Custom RSVP fields table
CREATE TABLE IF NOT EXISTS custom_rsvp_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox', 'number', 'email', 'tel', 'url')),
  placeholder TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB, -- For select fields: { "options": ["Option 1", "Option 2"] }
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom RSVP field responses table
CREATE TABLE IF NOT EXISTS custom_rsvp_field_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsvp_id UUID NOT NULL REFERENCES rsvps(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_rsvp_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rsvp_id, field_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_rsvp_fields_event_id ON custom_rsvp_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_custom_rsvp_field_responses_rsvp_id ON custom_rsvp_field_responses(rsvp_id);
CREATE INDEX IF NOT EXISTS idx_custom_rsvp_field_responses_field_id ON custom_rsvp_field_responses(field_id);

