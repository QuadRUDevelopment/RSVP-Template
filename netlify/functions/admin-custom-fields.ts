import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.ADMIN_JWT_SECRET;

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const verifyAuth = (event: any): { valid: boolean; error?: string } => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    jwt.verify(token, jwtSecret);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
};

export const handler: Handler = async (event) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const auth = verifyAuth(event);
  if (!auth.valid) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: auth.error || 'Unauthorized' }),
    };
  }

  try {
    const slug = event.queryStringParameters?.slug;
    if (!slug) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing slug parameter' }),
      };
    }

    // Get event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !eventData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;

    if (event.httpMethod === 'GET') {
      // Get all custom fields for this event
      const { data, error } = await supabase
        .from('custom_rsvp_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching custom fields:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to fetch custom fields' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customFields: data || [] }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Create new custom field
      const body = JSON.parse(event.body || '{}');
      const { label, field_type, placeholder, required, options, sort_order } = body;

      if (!label || !field_type) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields: label, field_type' }),
        };
      }

      const { data, error } = await supabase
        .from('custom_rsvp_fields')
        .insert({
          event_id: eventId,
          label,
          field_type,
          placeholder: placeholder || null,
          required: required || false,
          options: options || null,
          sort_order: sort_order || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating custom field:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to create custom field' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customField: data }),
      };
    }

    if (event.httpMethod === 'PUT') {
      // Update custom field
      const body = JSON.parse(event.body || '{}');
      const { id, label, field_type, placeholder, required, options, sort_order } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing field id' }),
        };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (label !== undefined) updateData.label = label;
      if (field_type !== undefined) updateData.field_type = field_type;
      if (placeholder !== undefined) updateData.placeholder = placeholder;
      if (required !== undefined) updateData.required = required;
      if (options !== undefined) updateData.options = options;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      const { data, error } = await supabase
        .from('custom_rsvp_fields')
        .update(updateData)
        .eq('id', id)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating custom field:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to update custom field' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customField: data }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Delete custom field
      const id = event.queryStringParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing field id' }),
        };
      }

      const { error } = await supabase
        .from('custom_rsvp_fields')
        .delete()
        .eq('id', id)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error deleting custom field:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to delete custom field' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err: any) {
    console.error('Error in admin-custom-fields:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

