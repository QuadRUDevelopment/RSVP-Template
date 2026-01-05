import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const slug = event.queryStringParameters?.slug;

  if (!slug) {
    return {
      statusCode: 400,
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
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;

    // Get menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    if (menuError) {
      console.error('Error fetching menu:', menuError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch menu' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ menuItems: menuItems || [] }),
    };
  } catch (err: any) {
    console.error('Error in public-menu:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

