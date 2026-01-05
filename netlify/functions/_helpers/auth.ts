/**
 * Shared authentication helper for Netlify Functions
 * Verifies Supabase Auth tokens
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthResult {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Verifies a Supabase Auth token from the Authorization header
 */
export async function verifySupabaseAuth(event: any): Promise<AuthResult> {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Missing or invalid authorization header',
    };
  }

  try {
    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        valid: false,
        error: 'Invalid or expired token',
      };
    }

    // Check if user is an admin (you can add role checking here if needed)
    // For now, any authenticated user is considered an admin
    return {
      valid: true,
      userId: user.id,
      email: user.email,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message || 'Token verification failed',
    };
  }
}

