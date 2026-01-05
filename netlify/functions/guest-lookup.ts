import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { slug, inviteCode, firstName, lastName } = body;

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing slug parameter' }),
      };
    }

    // Get event first
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
    let guest = null;

    // Lookup by invite code (preferred)
    if (inviteCode) {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .eq('invite_code', inviteCode)
        .single();

      if (!error && data) {
        guest = data;
      }
    } 
    // Lookup by name (fallback)
    else if (firstName && lastName) {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .ilike('first_name', firstName)
        .ilike('last_name', lastName)
        .limit(5);

      if (!error && data && data.length > 0) {
        // Return first match (or all matches for user to select)
        guest = data[0];
      }
    }

    if (!guest) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Guest not found' }),
      };
    }

    // Get RSVP if exists
    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('guest_id', guest.id)
      .single();

    // Get plus ones
    const { data: plusOnesData } = await supabase
      .from('plus_ones')
      .select('*')
      .eq('guest_id', guest.id);

    // Get menu items
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    // Get accommodations (filtered by audience)
    const { data: accommodations } = await supabase
      .from('accommodations')
      .select('*')
      .eq('event_id', eventId)
      .in('audience_key', ['all', guest.group_key])
      .order('sort_order', { ascending: true });

    // Get timeline items (filtered by audience)
    const { data: timelineItems } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('event_id', eventId)
      .in('audience_key', ['all', guest.group_key])
      .order('sort_order', { ascending: true });

    // Get gallery items
    const { data: galleryItems } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        guest,
        rsvp: rsvpData || null,
        plusOnes: plusOnesData || [],
        menuItems: menuItems || [],
        accommodations: accommodations || [],
        timelineItems: timelineItems || [],
        gallery: galleryItems || [],
      }),
    };
  } catch (err: any) {
    console.error('Error in guest-lookup:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

