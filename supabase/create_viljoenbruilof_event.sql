-- Create event for viljoenbruilof.quadrursvp.site
-- Run this in your Supabase SQL Editor

INSERT INTO events (
  slug,
  title,
  banner_text,
  date_text,
  venue_text,
  invitation_text,
  story_text,
  guest_message,
  site_name,
  wedding_date
) VALUES (
  'viljoenbruilof',
  'Viljoen Bruilof', -- Update with actual event title
  'Welcome to our celebration!', -- Update with actual banner text
  '2025-01-15', -- Update with actual date
  'Beautiful Venue', -- Update with actual venue
  'You are cordially invited to celebrate with us!', -- Update with actual invitation
  'Our love story...', -- Update with your story
  'We are so excited to celebrate this special day with all of you!', -- Update with your message
  'Viljoen Bruilof', -- Browser tab title
  '2025-01-15T00:00:00Z'::timestamptz -- Update with actual wedding date/time
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  banner_text = EXCLUDED.banner_text,
  date_text = EXCLUDED.date_text,
  venue_text = EXCLUDED.venue_text,
  invitation_text = EXCLUDED.invitation_text,
  story_text = EXCLUDED.story_text,
  guest_message = EXCLUDED.guest_message,
  site_name = EXCLUDED.site_name,
  wedding_date = EXCLUDED.wedding_date,
  updated_at = NOW();

-- Optional: Create default groups for this event
INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  (SELECT id FROM events WHERE slug = 'viljoenbruilof'),
  'all',
  'All Guests',
  'Default group for all guests',
  0
ON CONFLICT (event_id, key) DO NOTHING;

INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  (SELECT id FROM events WHERE slug = 'viljoenbruilof'),
  'family',
  'Family',
  'Family members',
  1
ON CONFLICT (event_id, key) DO NOTHING;

INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  (SELECT id FROM events WHERE slug = 'viljoenbruilof'),
  'friends',
  'Friends',
  'Friends of the couple',
  2
ON CONFLICT (event_id, key) DO NOTHING;

-- Verify the event was created
SELECT 
  id,
  slug,
  title,
  site_name,
  created_at
FROM events 
WHERE slug = 'viljoenbruilof';

