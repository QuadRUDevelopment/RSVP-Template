# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a Supabase project at https://supabase.com
   - Run the SQL from `supabase/schema.sql` in the Supabase SQL editor
   - Get your credentials from Project Settings > API

3. **Create environment file:**
   Create a `.env` file in the root with:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_PASSWORD=your-secure-password
   ADMIN_JWT_SECRET=your-random-secret
   ```

4. **Run locally:**
   ```bash
   # For frontend only
   npm run dev

   # For frontend + Netlify Functions (recommended)
   npm install -g netlify-cli
   netlify dev
   ```

5. **Test with event slug:**
   - Visit `http://localhost:5173?event=test-event`
   - Or set up local DNS for subdomain testing

## Creating Your First Event

1. Insert an event into Supabase:
   ```sql
   INSERT INTO events (slug, title, banner_text, date_text, venue_text)
   VALUES ('test-event', 'Test Event', 'Welcome!', '2024-12-31', 'Test Venue');
   ```

2. Insert a test guest:
   ```sql
   INSERT INTO guests (event_id, invite_code, first_name, last_name, display_name, max_plus_ones)
   VALUES (
     (SELECT id FROM events WHERE slug = 'test-event'),
     'TEST123',
     'John',
     'Doe',
     'John Doe',
     2
   );
   ```

3. Visit `http://localhost:5173?event=test-event` and test the RSVP flow

## Admin Access

1. Visit `/admin/login`
2. Enter the password from your `.env` file
3. Access the dashboard and manage your event

