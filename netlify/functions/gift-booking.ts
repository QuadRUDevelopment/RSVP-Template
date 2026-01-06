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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

  try {
    // For GET, use query params; for POST/DELETE, use body
    const isGet = event.httpMethod === 'GET';
    const params = isGet ? event.queryStringParameters || {} : (event.body ? JSON.parse(event.body) : {});
    const slug = params.slug || event.queryStringParameters?.slug;
    const inviteCode = params.inviteCode || event.queryStringParameters?.inviteCode;
    const firstName = params.firstName || event.queryStringParameters?.firstName;
    const lastName = params.lastName || event.queryStringParameters?.lastName;
    const giftId = params.giftId || event.queryStringParameters?.giftId;

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

    // Get event by slug
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, max_gifts_per_guest')
      .eq('slug', slug)
      .single();

    if (eventError || !eventData) {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;
    const maxGiftsPerGuest = eventData.max_gifts_per_guest ?? 1;

    // Lookup guest (same pattern as guest-lookup)
    let guest = null;
    if (inviteCode) {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .ilike('invite_code', inviteCode.trim())
        .single();

      if (error) {
        console.error('Invite code lookup error:', error);
      } else if (data) {
        guest = data;
      }
    } else if (firstName && lastName) {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .ilike('first_name', `%${firstName.trim()}%`)
        .ilike('last_name', `%${lastName.trim()}%`)
        .limit(1)
        .single();

      if (error) {
        console.error('Name lookup error:', error);
      } else if (data) {
        guest = data;
      }
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
          details: 'Please check your invite code or name and try again.',
        }),
      };
    }

    // GET - Get guest's bookings
    if (event.httpMethod === 'GET') {
      const { data: bookings, error: bookingsError } = await supabase
        .from('gift_bookings')
        .select(`
          *,
          gift_registry!inner(id, name, description, url)
        `)
        .eq('event_id', eventId)
        .eq('guest_id', guest.id)
        .order('booked_at', { ascending: false });

      if (bookingsError) {
        return {
          statusCode: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Failed to fetch bookings' }),
        };
      }

      const remainingGifts = Math.max(0, maxGiftsPerGuest - (bookings?.length || 0));

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookings: bookings || [],
          maxGiftsPerGuest,
          remainingGifts,
        }),
      };
    }

    // POST - Book a gift
    if (event.httpMethod === 'POST') {
      if (!giftId) {
        return {
          statusCode: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Missing giftId parameter' }),
        };
      }

      // Verify gift exists and belongs to event
      const { data: giftData, error: giftError } = await supabase
        .from('gift_registry')
        .select('id')
        .eq('id', giftId)
        .eq('event_id', eventId)
        .single();

      if (giftError || !giftData) {
        return {
          statusCode: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Gift not found' }),
        };
      }

      // Check if gift is already booked
      const { data: existingBooking } = await supabase
        .from('gift_bookings')
        .select('id, guest_id')
        .eq('gift_id', giftId)
        .single();

      if (existingBooking) {
        // If guest already booked this gift, return error
        if (existingBooking.guest_id === guest.id) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'You have already booked this gift' }),
          };
        }
        // If someone else booked it, return error
        return {
          statusCode: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'This gift has already been booked' }),
        };
      }

      // Check guest's current bookings count
      const { data: guestBookings, error: countError } = await supabase
        .from('gift_bookings')
        .select('id')
        .eq('event_id', eventId)
        .eq('guest_id', guest.id);

      if (countError) {
        return {
          statusCode: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Failed to check bookings' }),
        };
      }

      const currentBookingsCount = guestBookings?.length || 0;

      // Check limit (unless maxGiftsPerGuest is 0 = unlimited)
      if (maxGiftsPerGuest > 0 && currentBookingsCount >= maxGiftsPerGuest) {
        // If limit is 1, allow changing gift (release old, book new)
        if (maxGiftsPerGuest === 1 && currentBookingsCount === 1) {
          // Release old booking
          await supabase
            .from('gift_bookings')
            .delete()
            .eq('event_id', eventId)
            .eq('guest_id', guest.id);
        } else {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              error: `You've reached your gift limit (${maxGiftsPerGuest} gift${maxGiftsPerGuest > 1 ? 's' : ''})`,
            }),
          };
        }
      }

      // Get RSVP if exists (optional link)
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('guest_id', guest.id)
        .single();

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('gift_bookings')
        .insert({
          event_id: eventId,
          gift_id: giftId,
          guest_id: guest.id,
          rsvp_id: rsvpData?.id || null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        return {
          statusCode: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Failed to book gift' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true, booking }),
      };
    }

    // DELETE - Release a gift
    if (event.httpMethod === 'DELETE') {
      if (!giftId) {
        return {
          statusCode: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Missing giftId parameter' }),
        };
      }

      // Verify booking exists and belongs to guest
      const { data: booking, error: bookingError } = await supabase
        .from('gift_bookings')
        .select('id, guest_id')
        .eq('gift_id', giftId)
        .eq('event_id', eventId)
        .eq('guest_id', guest.id)
        .single();

      if (bookingError || !booking) {
        return {
          statusCode: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Booking not found or you do not own this booking' }),
        };
      }

      // Delete booking
      const { error: deleteError } = await supabase
        .from('gift_bookings')
        .delete()
        .eq('id', booking.id);

      if (deleteError) {
        return {
          statusCode: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Failed to release booking' }),
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err: any) {
    console.error('Error in gift-booking:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

