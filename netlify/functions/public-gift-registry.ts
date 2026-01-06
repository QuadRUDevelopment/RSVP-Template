import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const slug = event.queryStringParameters?.slug;

  if (!slug) {
    return {
      statusCode: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Missing slug parameter' }),
    };
  }

  try {
    // Get event by slug
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !eventData) {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;

    // Get all gifts for this event
    const { data: gifts, error: giftsError } = await supabase
      .from('gift_registry')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    if (giftsError) {
      console.error('Error fetching gifts:', giftsError);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to fetch gifts' }),
      };
    }

    // Get all bookings for this event (to show booked status)
    const { data: bookings, error: bookingsError } = await supabase
      .from('gift_bookings')
      .select('gift_id')
      .eq('event_id', eventId);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Map bookings to gifts (only show booked status, not guest names for privacy)
    const giftsWithStatus = (gifts || []).map((gift) => {
      const isBooked = (bookings || []).some((b: any) => b.gift_id === gift.id);
      return {
        ...gift,
        booked: isBooked,
      };
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gifts: giftsWithStatus }),
    };
  } catch (err: any) {
    console.error('Error in public-gift-registry:', err);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

