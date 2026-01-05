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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { slug, inviteCode, firstName, lastName } = body;

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

    // Get event first
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (eventError || !eventData) {
      console.error('Event lookup error:', eventError);
      console.error('Looking for slug:', slug);
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Event not found',
          details: eventError?.message || 'No event found with slug: ' + slug,
        }),
      };
    }

    const eventId = eventData.id;
    let guest = null;
    let lookupError = null;

    // Lookup by invite code (preferred)
    if (inviteCode) {
      console.log('Looking up guest by invite code:', inviteCode, 'for event:', eventId);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .eq('invite_code', inviteCode.trim())
        .single();

      if (error) {
        console.error('Invite code lookup error:', error);
        lookupError = error.message;
      } else if (data) {
        guest = data;
        console.log('Guest found by invite code:', guest.id);
      } else {
        console.log('No guest found with invite code:', inviteCode);
      }
    } 
    // Lookup by name (fallback)
    else if (firstName && lastName) {
      console.log('Looking up guest by name:', firstName, lastName, 'for event:', eventId);
      // Use case-insensitive search with pattern matching
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .ilike('first_name', `%${firstName.trim()}%`)
        .ilike('last_name', `%${lastName.trim()}%`)
        .limit(5);

      if (error) {
        console.error('Name lookup error:', error);
        lookupError = error.message;
      } else if (data && data.length > 0) {
        // Return first match (or all matches for user to select)
        guest = data[0];
        console.log('Guest found by name:', guest.id);
      } else {
        console.log('No guest found with name:', firstName, lastName);
      }
    } else {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing lookup parameters',
          details: 'Please provide either inviteCode or both firstName and lastName',
        }),
      };
    }

    if (!guest) {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Guest not found',
          details: lookupError || `No guest found with the provided ${inviteCode ? 'invite code' : 'name'}`,
          searched: inviteCode ? { inviteCode, eventId } : { firstName, lastName, eventId },
        }),
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
        ...corsHeaders,
        'Content-Type': 'application/json',
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

