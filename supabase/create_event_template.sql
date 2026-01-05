-- Template: Create Event in Supabase
-- Replace 'your-event-slug' with your actual event slug
-- Run this in your Supabase SQL Editor

-- Step 1: Create the event
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
  wedding_date,
  menu_enabled,
  schedule_enabled
) VALUES (
  'your-event-slug', -- ⚠️ CHANGE THIS to your event slug (e.g., 'viljoenbruilof')
  'Your Event Title', -- ⚠️ CHANGE THIS
  'Welcome to our celebration!', -- ⚠️ CHANGE THIS
  '2025-01-15', -- ⚠️ CHANGE THIS to your event date
  'Your Venue Name', -- ⚠️ CHANGE THIS
  'You are cordially invited to celebrate with us!', -- ⚠️ CHANGE THIS
  'Our love story begins...', -- ⚠️ CHANGE THIS
  'We are so excited to celebrate this special day with all of you!', -- ⚠️ CHANGE THIS
  'Your Event Name', -- ⚠️ Browser tab title - CHANGE THIS
  '2025-01-15T00:00:00Z'::timestamptz, -- ⚠️ Wedding date/time - CHANGE THIS
  true, -- Menu enabled
  true -- Schedule enabled
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
  menu_enabled = EXCLUDED.menu_enabled,
  schedule_enabled = EXCLUDED.schedule_enabled,
  updated_at = NOW();

-- Step 2: Create default groups for this event
INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  (SELECT id FROM events WHERE slug = 'your-event-slug'), -- ⚠️ CHANGE THIS to match slug above
  'all',
  'All Guests',
  'Default group for all guests',
  0
ON CONFLICT (event_id, key) DO NOTHING;

INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  (SELECT id FROM events WHERE slug = 'your-event-slug'), -- ⚠️ CHANGE THIS to match slug above
  'family',
  'Family',
  'Family members',
  1
ON CONFLICT (event_id, key) DO NOTHING;

INSERT INTO groups (event_id, key, name, description, sort_order)
SELECT 
  (SELECT id FROM events WHERE slug = 'your-event-slug'), -- ⚠️ CHANGE THIS to match slug above
  'friends',
  'Friends',
  'Friends of the couple',
  2
ON CONFLICT (event_id, key) DO NOTHING;

-- Step 3: Verify the event was created
SELECT 
  id,
  slug,
  title,
  site_name,
  wedding_date,
  created_at
FROM events 
WHERE slug = 'your-event-slug'; -- ⚠️ CHANGE THIS to match slug above

-- If the query returns a row, the event was created successfully!

