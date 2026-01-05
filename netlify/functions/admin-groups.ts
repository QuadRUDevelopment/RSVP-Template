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

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const params = new URLSearchParams(event.rawQuery || '');
    const slug = params.get('slug');
    const id = params.get('id');

    // Get event by slug
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !eventData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;

    // GET - List all groups for event
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ groups: data || [] }),
      };
    }

    // POST - Create new group
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { key, name, description, sort_order } = body;

      if (!key || !name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Key and name are required' }),
        };
      }

      const { data, error } = await supabase
        .from('groups')
        .insert({
          event_id: eventId,
          key: key.toLowerCase().trim(),
          name,
          description: description || null,
          sort_order: sort_order || 0,
        })
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    // PUT - Update group
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { id: groupId, name, description, sort_order } = body;

      if (!groupId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Group ID is required' }),
        };
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      const { data, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    // DELETE - Delete group
    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Group ID is required' }),
        };
      }

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)
        .eq('event_id', eventId);

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

