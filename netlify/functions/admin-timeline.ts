import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me-in-production';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export const handler: Handler = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const token = authHeader.substring(7);
  if (!verifyToken(token)) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  const slug = event.queryStringParameters?.slug;

  // GET - List all timeline items
  if (event.httpMethod === 'GET') {
    if (!slug) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing slug parameter' }),
      };
    }

    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!eventData) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }

      const { data, error } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('event_id', eventData.id)
        .order('sort_order', { ascending: true });

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to fetch timeline items' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ timelineItems: data || [] }),
      };
    } catch (err: any) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // POST - Create timeline item
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { slug: bodySlug, ...timelineItemData } = body;
      const eventSlug = slug || bodySlug;

      if (!eventSlug) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing slug' }),
        };
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventSlug)
        .single();

      if (!eventData) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }

      const { data, error } = await supabase
        .from('timeline_items')
        .insert({
          ...timelineItemData,
          event_id: eventData.id,
        })
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to create timeline item' }),
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

  // PUT - Update timeline item
  if (event.httpMethod === 'PUT') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { id, ...updateData } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing timeline item id' }),
        };
      }

      const { data, error } = await supabase
        .from('timeline_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to update timeline item' }),
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

  // DELETE - Delete timeline item
  if (event.httpMethod === 'DELETE') {
    try {
      const id = event.queryStringParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing timeline item id' }),
        };
      }

      const { error } = await supabase
        .from('timeline_items')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to delete timeline item' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ success: true }),
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

