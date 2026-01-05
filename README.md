# QuadruRSVP

A reusable, white-label RSVP web app that can host many events under your domain using subdomains.

## Features

- **Multi-Event Support**: Each subdomain maps to a different event
- **Guest RSVP Flow**: Invite code or name-based lookup
- **Admin Dashboard**: Manage guests, menu, accommodation, timeline, gallery, and settings
- **Plus Ones Support**: Allow guests to bring additional attendees
- **Meal Selection**: Menu management with dietary options
- **Group Filtering**: Show accommodation and timeline items based on guest groups

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Netlify Functions
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router
- **State Management**: Zustand
- **Animations**: Framer Motion

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Netlify account (for deployment)

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and anon key from Project Settings > API

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Netlify Functions (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=your_admin_password
ADMIN_JWT_SECRET=your_jwt_secret
```

For local development with Netlify Functions, install Netlify CLI:

```bash
npm install -g netlify-cli
```

Then run:

```bash
netlify dev
```

### 5. Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

For local development with subdomain testing, you can use query parameters:
- `http://localhost:5173?event=your-event-slug`

### 6. Build for Production

```bash
npm run build
```

### 7. Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Configure DNS for wildcard subdomains:
   - Add domain: `quadrursvp.co.za`
   - Add wildcard: `*.quadrursvp.co.za`
   - Point DNS records to Netlify

## Project Structure

```
src/
  app/              # App configuration and routing
  pages/            # Page components
    Home/           # Landing page
    RSVP/           # RSVP flow
    admin/          # Admin pages
  components/       # Reusable components
    layout/         # Layout components
    ui/             # UI components
    rsvp/           # RSVP-specific components
  lib/              # Utilities and API clients
  state/            # State management (Zustand stores)
netlify/
  functions/        # Netlify serverless functions
supabase/
  schema.sql        # Database schema
```

## Creating Your First Event

1. Log in to the admin panel
2. Go to Settings
3. Create a new event with a slug (e.g., `wiehanmoniquebruiloif`)
4. Add guests with invite codes
5. Configure menu, accommodation, timeline, and gallery
6. Access the event at `wiehanmoniquebruiloif.quadrursvp.co.za`

## API Functions

### Public Functions
- `public-event` - Get event details by slug
- `guest-lookup` - Look up guest by invite code or name
- `rsvp-submit` - Submit RSVP

### Admin Functions (require authentication)
- `admin-login` - Authenticate admin
- `admin-dashboard` - Get dashboard statistics
- `admin-guests` - Manage guests (to be implemented)
- `admin-menu` - Manage menu items (to be implemented)
- `admin-accommodation` - Manage accommodations (to be implemented)
- `admin-timeline` - Manage timeline items (to be implemented)
- `admin-gallery` - Manage gallery (to be implemented)
- `admin-settings` - Manage event settings (to be implemented)

## License

MIT
