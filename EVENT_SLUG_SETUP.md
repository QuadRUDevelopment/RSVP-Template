# Event Slug Setup Guide

## Overview

Event slugs are the identifiers that map subdomains to events. The slug is automatically extracted from the subdomain URL.

## How It Works

### 1. Automatic Slug Detection

The event slug is **automatically extracted from the subdomain**:

- `wiehanmoniquebruiloif.quadrursvp.co.za` → Event slug: `wiehanmoniquebruiloif`
- `johnmarywedding.quadrursvp.co.za` → Event slug: `johnmarywedding`
- `test-event.quadrursvp.co.za` → Event slug: `test-event`

**Location:** `src/lib/eventResolver.ts`
- Function: `getEventSlugFromHostname()` - Extracts slug from hostname
- Function: `getCurrentEventSlug()` - Gets current slug with fallback

### 2. Where Event Slugs Are Configured

#### In Admin Settings (`/admin/settings`)

**Location:** `src/pages/admin/Settings/Settings.tsx`

The Settings page shows the event slug:
- **Field:** "Event Slug (Subdomain)"
- **Behavior:** 
  - Auto-filled from the current subdomain
  - Read-only (cannot be changed after creation)
  - If event doesn't exist, slug is pre-filled for creation

#### In Database

**Location:** `supabase/schema.sql`

Events table structure:
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,  -- This is the event slug
  title TEXT NOT NULL,
  ...
);
```

### 3. Creating a New Event

#### Step 1: Access Admin via Subdomain

Visit the subdomain you want to use:
```
https://your-event-slug.quadrursvp.co.za/admin/login
```

Example:
```
https://wiehanmoniquebruiloif.quadrursvp.co.za/admin/login
```

#### Step 2: Login

- Enter your admin password
- You'll be redirected to the dashboard

#### Step 3: Go to Settings

- Click "Settings" in the admin sidebar
- The event slug is automatically detected from the subdomain
- It appears in the "Event Slug (Subdomain)" field (read-only)

#### Step 4: Fill in Event Details

Fill in:
- Event Title
- Banner Text
- Date Text
- Venue Text
- And all other settings...

#### Step 5: Save

- Click "Save Settings"
- The event is **automatically created** if it doesn't exist
- Or **updated** if it already exists

**Backend:** `netlify/functions/admin-settings.ts`
- Checks if event exists by slug
- Creates new event if not found
- Updates existing event if found

### 4. Editing an Existing Event

1. Visit the subdomain for that event:
   ```
   https://existing-event.quadrursvp.co.za/admin/login
   ```

2. Login and go to Settings

3. Edit any fields (slug cannot be changed)

4. Click "Save Settings"

### 5. Manual Event Creation (Alternative)

If you prefer to create events manually in the database:

**Location:** `supabase/seed_test_event.sql`

```sql
INSERT INTO events (
  slug,
  title,
  banner_text,
  date_text,
  venue_text
) VALUES (
  'your-event-slug',
  'Your Event Title',
  'Welcome!',
  'December 31, 2024',
  'Your Venue'
);
```

Then access via: `https://your-event-slug.quadrursvp.co.za`

## Important Notes

### ✅ Slug Rules

- **Must be unique** - Each slug can only be used once
- **URL-safe** - Use lowercase letters, numbers, and hyphens
- **No spaces** - Use hyphens instead (e.g., `john-mary-wedding`)
- **Cannot be changed** - Once created, the slug is permanent

### ✅ Subdomain Requirements

- **Wildcard DNS** must be configured: `*.quadrursvp.co.za`
- **SSL certificate** is automatically issued by Netlify
- **DNS propagation** can take up to 48 hours

### ✅ Local Development

For local development, use query parameters:
```
http://localhost:5173?event=test-event
```

Or the default event slug: `default-event`

## Troubleshooting

### Event Not Found

**Error:** "Event not found" when accessing a subdomain

**Solution:**
1. Visit the subdomain: `https://your-slug.quadrursvp.co.za/admin/login`
2. Login to admin
3. Go to Settings
4. Fill in event details and save
5. Event will be created automatically

### Slug Already Exists

**Error:** "Slug already exists" or duplicate key error

**Solution:**
- The slug is already in use
- Choose a different subdomain/slug
- Or access the existing event via its subdomain

### Subdomain Not Working

**Issue:** Subdomain doesn't resolve

**Solution:**
1. Check DNS configuration (wildcard CNAME)
2. Wait for DNS propagation (up to 48 hours)
3. Verify SSL certificate is issued in Netlify
4. Test with: `dig your-slug.quadrursvp.co.za`

## Summary

**Event Slug Setup Locations:**

1. **Automatic Detection:** `src/lib/eventResolver.ts`
2. **Admin UI:** `src/pages/admin/Settings/Settings.tsx`
3. **Backend API:** `netlify/functions/admin-settings.ts`
4. **Database:** `supabase/schema.sql` (events table)

**Workflow:**
1. Visit subdomain → Slug auto-detected
2. Login to admin → Go to Settings
3. Slug is pre-filled → Fill in details
4. Save → Event created/updated automatically

No manual database setup required! 🎉

