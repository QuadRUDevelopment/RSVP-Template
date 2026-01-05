# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```env
# Supabase Configuration (Frontend - Public)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Configuration (Backend - Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Admin Authentication
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_JWT_SECRET=your-random-jwt-secret-string
```

## Where to Find Each Value

### 1. Supabase Credentials

**Step 1:** Go to [https://supabase.com](https://supabase.com) and sign in

**Step 2:** Create a new project (or select existing project)

**Step 3:** Go to **Project Settings** → **API**

You'll find:

#### `VITE_SUPABASE_URL`
- **Location:** Project Settings → API → Project URL
- **Format:** `https://xxxxxxxxxxxxx.supabase.co`
- **Example:** `https://abcdefghijklmnop.supabase.co`
- **Used by:** Frontend React app (public access)

#### `VITE_SUPABASE_ANON_KEY`
- **Location:** Project Settings → API → Project API keys → `anon` `public`
- **Format:** Long string starting with `eyJ...`
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Used by:** Frontend React app (public access, has Row Level Security)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Location:** Project Settings → API → Project API keys → `service_role` `secret`
- **Format:** Long string starting with `eyJ...`
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **⚠️ IMPORTANT:** This key bypasses Row Level Security - **NEVER** expose it in frontend code
- **Used by:** Netlify Functions (server-side only)

### 2. Admin Authentication

#### `ADMIN_PASSWORD`
- **What it is:** The password for admin login
- **Where to set:** You create this yourself
- **Requirements:** 
  - Should be strong and secure
  - At least 12 characters recommended
  - Mix of letters, numbers, and special characters
- **Example:** `MySecureAdminPass123!`
- **Used by:** Admin login function

#### `ADMIN_JWT_SECRET`
- **What it is:** Secret key for signing JWT tokens
- **Where to set:** You create this yourself
- **Requirements:**
  - Should be a long, random string
  - At least 32 characters recommended
  - Can use: `openssl rand -base64 32` to generate
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`
- **Used by:** Admin authentication JWT signing

## Complete .env File Example

```env
# Supabase - Frontend (Public)
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890

# Supabase - Backend (Server-side only - NEVER expose in frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.abcdefghijklmnopqrstuvwxyz1234567890

# Admin Authentication
ADMIN_PASSWORD=MySecureAdminPassword123!
ADMIN_JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## Quick Setup Steps

1. **Create the file:**
   ```bash
   touch .env
   ```

2. **Open the file and add your values:**
   ```bash
   # On Mac/Linux
   nano .env
   # or
   code .env
   ```

3. **Copy the template above and replace with your actual values**

4. **Generate a secure JWT secret (optional but recommended):**
   ```bash
   # On Mac/Linux
   openssl rand -base64 32
   
   # Or use an online generator
   # https://www.random.org/strings/
   ```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` to git (it's already in `.gitignore`)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- Use strong passwords for `ADMIN_PASSWORD`
- Use a long random string for `ADMIN_JWT_SECRET`
- In production (Netlify), set these as environment variables in the Netlify dashboard

## For Netlify Deployment

When deploying to Netlify, add these environment variables in:
1. Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Add each variable with the same names
3. Netlify Functions will automatically have access to them

## Verification

After setting up your `.env` file:

1. **Check if variables are loaded:**
   ```bash
   npm run dev
   ```
   - Should start without errors
   - Check browser console for any Supabase warnings

2. **Test admin login:**
   - Visit `http://localhost:5173/admin/login`
   - Use your `ADMIN_PASSWORD` to log in

3. **Test Supabase connection:**
   - Try accessing the home page
   - Check browser network tab for Supabase API calls

## Troubleshooting

**"Missing Supabase environment variables" warning:**
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Make sure `.env` file is in the root directory
- Restart dev server after creating/editing `.env`

**Netlify Functions errors:**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify environment variables
- Check that `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` are set

**Admin login not working:**
- Verify `ADMIN_PASSWORD` matches what you're typing
- Check that `ADMIN_JWT_SECRET` is set
- Check browser console for errors

