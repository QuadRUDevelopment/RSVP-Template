import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseAuth } from './_helpers/auth';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Verify Supabase auth token
  const authResult = await verifySupabaseAuth(event);
  if (!authResult.valid) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: authResult.error || 'Unauthorized' }),
    };
  }

  const slug = event.queryStringParameters?.slug;
  if (!slug) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing slug parameter' }),
    };
  }

  try {
    // Get event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !eventData) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;

    // Get total guests
    const { count: totalGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    // Get RSVPs
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId);

    const totalSubmissions = rsvps?.length || 0;
    const notSubmitted = (totalGuests || 0) - totalSubmissions;
    
    const attendingYes = rsvps?.filter(r => r.status === 'yes').length || 0;
    const attendingNo = rsvps?.filter(r => r.status === 'no').length || 0;
    const maybe = rsvps?.filter(r => r.status === 'maybe').length || 0;

    // Calculate total headcount (guests + plus ones)
    const totalHeadcount = rsvps?.reduce((sum, rsvp) => {
      return sum + 1 + (rsvp.plus_ones_count || 0);
    }, 0) || 0;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        totalGuests: totalGuests || 0,
        totalSubmissions,
        notSubmitted,
        attendingYes,
        attendingNo,
        maybe,
        totalHeadcount,
      }),
    };
  } catch (err: any) {
    console.error('Error in admin-dashboard:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

