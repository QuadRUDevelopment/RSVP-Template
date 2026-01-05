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
  // Verify Supabase auth token
  const authResult = await verifySupabaseAuth(event);
  if (!authResult.valid) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: authResult.error || 'Unauthorized' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  const slug = event.queryStringParameters?.slug;

  if (event.httpMethod === 'GET') {
    if (!slug) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing slug parameter' }),
      };
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(data),
      };
    } catch (err: any) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { slug: bodySlug, ...updateData } = body;
      const eventSlug = slug || bodySlug;

      if (!eventSlug) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing slug' }),
        };
      }

      // Check if event exists
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventSlug)
        .single();

      let result;
      if (existingEvent) {
        // Update existing event
        const { data, error } = await supabase
          .from('events')
          .update(updateData)
          .eq('slug', eventSlug)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Failed to update event' }),
          };
        }
        result = data;
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert({
            slug: eventSlug,
            title: updateData.title || 'New Event',
            ...updateData,
          })
          .select()
          .single();

        if (error) {
          console.error('Create error:', error);
          return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Failed to create event: ' + error.message }),
          };
        }
        result = data;
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(result),
      };
    } catch (err: any) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

