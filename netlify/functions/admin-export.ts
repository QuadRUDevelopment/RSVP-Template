import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseAuth } from './_helpers/auth';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export const handler: Handler = async (event) => {
  // Handle preflight OPTIONS request first (before auth check)
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

  // Verify Supabase auth token
  const authResult = await verifySupabaseAuth(event);
  if (!authResult.valid) {
    return {
      statusCode: 401,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: authResult.error || 'Unauthorized' }),
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const slug = event.queryStringParameters?.slug;
  const format = event.queryStringParameters?.format || 'json'; // csv or json

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

    // Get guests with RSVP data
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select(`
        *,
        rsvps (
          status,
          plus_ones_count,
          notes,
          submitted_at
        )
      `)
      .eq('event_id', eventData.id);

    if (guestsError) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to fetch guests' }),
      };
    }

    // Format data for export
    const exportData = (guests || []).map((guest: any) => {
      const rsvp = guest.rsvps?.[0] || {};
      return {
        invite_code: guest.invite_code,
        display_name: guest.display_name || `${guest.first_name} ${guest.last_name}`,
        first_name: guest.first_name,
        last_name: guest.last_name,
        group_key: guest.group_key,
        max_plus_ones: guest.max_plus_ones,
        email: guest.email,
        phone: guest.phone,
        rsvp_status: rsvp.status || 'not_submitted',
        plus_ones_count: rsvp.plus_ones_count || 0,
        rsvp_notes: rsvp.notes || '',
        rsvp_submitted_at: rsvp.submitted_at || '',
        created_at: guest.created_at,
        updated_at: guest.updated_at,
      };
    });

    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="guests-${slug}-${Date.now()}.csv"`,
          'Access-Control-Allow-Origin': '*',
        },
        body: csv,
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ guests: exportData }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};

