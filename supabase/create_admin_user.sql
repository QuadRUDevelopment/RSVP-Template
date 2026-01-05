-- Create Admin User in Supabase
-- Run this in your Supabase SQL Editor after enabling Email Auth

-- Step 1: Enable Email Auth (if not already enabled)
-- Go to: Authentication → Providers → Email → Enable

-- Step 2: Create admin user via Supabase Dashboard
-- Go to: Authentication → Users → Add User
-- Or use the Supabase Management API

-- Step 3: Set user metadata (optional - for role-based access)
-- You can add custom metadata to identify admin users

-- Example: Update user metadata to mark as admin
-- Replace 'USER_ID' with the actual user ID from auth.users table
/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE id = 'USER_ID';
*/

-- Note: The easiest way to create an admin user is:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" or "Invite User"
-- 3. Enter email: admin@yourdomain.com
-- 4. Set a secure password
-- 5. User will receive email confirmation (or auto-confirm if you set it)
-- 6. Use these credentials to log in to the admin panel

-- Alternative: Create user via Supabase CLI
-- supabase auth users create admin@yourdomain.com --password your-secure-password

