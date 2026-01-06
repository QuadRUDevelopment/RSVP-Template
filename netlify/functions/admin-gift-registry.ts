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
  // Handle preflight OPTIONS request first (before auth check)
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

  const slug = event.queryStringParameters?.slug;

  // GET - List all gifts with booking status
  if (event.httpMethod === 'GET') {
    if (!slug) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
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
          headers: { 'Access-Control-Allow-Origin': '*' },
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
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to fetch gifts' }),
        };
      }

      // Get all bookings for this event
      const { data: bookings, error: bookingsError } = await supabase
        .from('gift_bookings')
        .select(`
          *,
          guests!inner(id, first_name, last_name, display_name),
          gift_registry!inner(id)
        `)
        .eq('event_id', eventId);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      // Map bookings to gifts
      const giftsWithBookings = (gifts || []).map((gift) => {
        const booking = (bookings || []).find((b: any) => b.gift_id === gift.id);
        return {
          ...gift,
          booked: !!booking,
          booked_by: booking ? {
            guest_id: booking.guest_id,
            guest_name: booking.guests?.display_name || 
                       `${booking.guests?.first_name} ${booking.guests?.last_name}`.trim() ||
                       'Unknown',
            booked_at: booking.booked_at,
          } : null,
        };
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ gifts: giftsWithBookings }),
      };
    } catch (err: any) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // POST - Create or update gift
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { slug: bodySlug, ...giftData } = body;
      const eventSlug = slug || bodySlug;

      if (!eventSlug) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing slug' }),
        };
      }

      // Get event by slug
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventSlug)
        .single();

      if (eventError || !eventData) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }

      const eventId = eventData.id;

      // If updating, check if gift belongs to event
      if (giftData.id) {
        const { data: existingGift } = await supabase
          .from('gift_registry')
          .select('event_id')
          .eq('id', giftData.id)
          .single();

        if (!existingGift || existingGift.event_id !== eventId) {
          return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Gift not found' }),
          };
        }

        // Check if gift is booked
        const { data: booking } = await supabase
          .from('gift_bookings')
          .select('id')
          .eq('gift_id', giftData.id)
          .single();

        if (booking) {
          return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Cannot update a booked gift. Release the booking first.' }),
          };
        }
      }

      const { data, error } = await supabase
        .from('gift_registry')
        .upsert({
          ...giftData,
          event_id: eventId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting gift:', error);
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to save gift' }),
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

  // DELETE - Delete gift
  if (event.httpMethod === 'DELETE') {
    const giftId = event.queryStringParameters?.id;

    if (!slug || !giftId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing slug or id parameter' }),
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
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }

      const eventId = eventData.id;

      // Verify gift belongs to event
      const { data: giftData } = await supabase
        .from('gift_registry')
        .select('event_id')
        .eq('id', giftId)
        .single();

      if (!giftData || giftData.event_id !== eventId) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Gift not found' }),
        };
      }

      // Check if gift is booked
      const { data: booking } = await supabase
        .from('gift_bookings')
        .select('id')
        .eq('gift_id', giftId)
        .single();

      if (booking) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Cannot delete a booked gift. Release the booking first.' }),
        };
      }

      const { error } = await supabase
        .from('gift_registry')
        .delete()
        .eq('id', giftId)
        .eq('event_id', eventId);

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to delete gift' }),
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

