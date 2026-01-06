-- Gift Registry Schema
-- Multi-tenant gift registry system with event isolation

-- Gift registry table
CREATE TABLE IF NOT EXISTS gift_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_registry_event_id ON gift_registry(event_id);

-- Gift bookings table
-- Note: UNIQUE(gift_id) ensures one booking per gift
-- Note: NO UNIQUE(event_id, guest_id) allows multiple gifts per guest (limit enforced by application logic)
CREATE TABLE IF NOT EXISTS gift_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES gift_registry(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  rsvp_id UUID REFERENCES rsvps(id) ON DELETE SET NULL,
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gift_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_bookings_event_id ON gift_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_gift_bookings_gift_id ON gift_bookings(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_bookings_guest_id ON gift_bookings(guest_id);

-- Add gift registry feature toggle and max gifts per guest to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS gift_registry_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_gifts_per_guest INTEGER DEFAULT 1;

