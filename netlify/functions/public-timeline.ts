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

    // Get timeline items (public - audience_key = 'all')
    const { data: timelineItems, error: timelineError } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('event_id', eventId)
      .eq('audience_key', 'all')
      .order('sort_order', { ascending: true });

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch timeline' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ timelineItems: timelineItems || [] }),
    };
  } catch (err: any) {
    console.error('Error in public-timeline:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

