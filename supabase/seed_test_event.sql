-- Create a test event for local development
-- Run this in your Supabase SQL Editor

INSERT INTO events (
  slug,
  title,
  banner_text,
  date_text,
  venue_text,
  invitation_text,
  story_text,
  guest_message
) VALUES (
  'default-event',
  'Test Wedding Event',
  'Welcome to our celebration!',
  'December 31, 2024',
  'Beautiful Venue',
  'You are cordially invited to celebrate with us!',
  'We met in college and have been together for 5 amazing years. This is our story...',
  'We are so excited to celebrate this special day with all of you!'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  banner_text = EXCLUDED.banner_text,
  date_text = EXCLUDED.date_text,
  venue_text = EXCLUDED.venue_text,
  invitation_text = EXCLUDED.invitation_text,
  story_text = EXCLUDED.story_text,
  guest_message = EXCLUDED.guest_message;

-- Create a test guest
INSERT INTO guests (
  event_id,
  invite_code,
  first_name,
  last_name,
  display_name,
  group_key,
  max_plus_ones
) VALUES (
  (SELECT id FROM events WHERE slug = 'default-event'),
  'TEST123',
  'John',
  'Doe',
  'John Doe',
  'friends',
  2
) ON CONFLICT (event_id, invite_code) DO NOTHING;

