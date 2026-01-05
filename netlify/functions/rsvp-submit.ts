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
    const { slug, inviteCode, rsvp } = body;

    if (!slug || !inviteCode || !rsvp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
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
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const eventId = eventData.id;

    // Get guest
    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .eq('invite_code', inviteCode)
      .single();

    if (guestError || !guestData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Guest not found' }),
      };
    }

    // Validate plus ones count
    if (rsvp.plusOnes && rsvp.plusOnes.length > guestData.max_plus_ones) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Maximum ${guestData.max_plus_ones} plus ones allowed` 
        }),
      };
    }

    // Upsert RSVP
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .upsert({
        event_id: eventId,
        guest_id: guestData.id,
        status: rsvp.status,
        plus_ones_count: rsvp.plusOnes?.length || 0,
        meal_choice_id: rsvp.mealChoiceId || null,
        dietary_notes: rsvp.dietaryNotes || null,
        notes: rsvp.notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'event_id,guest_id',
      })
      .select()
      .single();

    if (rsvpError) {
      console.error('Error upserting RSVP:', rsvpError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save RSVP' }),
      };
    }

    // Delete existing plus ones
    await supabase
      .from('plus_ones')
      .delete()
      .eq('guest_id', guestData.id);

    // Insert new plus ones
    if (rsvp.plusOnes && rsvp.plusOnes.length > 0) {
      const plusOnesToInsert = rsvp.plusOnes.map((po: any) => ({
        event_id: eventId,
        guest_id: guestData.id,
        rsvp_id: rsvpData.id,
        name: po.name,
        meal_choice_id: po.mealChoiceId || null,
      }));

      const { error: plusOnesError } = await supabase
        .from('plus_ones')
        .insert(plusOnesToInsert);

      if (plusOnesError) {
        console.error('Error inserting plus ones:', plusOnesError);
      }
    }

    // Delete existing custom field responses
    await supabase
      .from('custom_rsvp_field_responses')
      .delete()
      .eq('rsvp_id', rsvpData.id);

    // Insert custom field responses
    if (rsvp.customFields && Object.keys(rsvp.customFields).length > 0) {
      const customFieldResponses = Object.entries(rsvp.customFields)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([fieldId, value]) => ({
          rsvp_id: rsvpData.id,
          field_id: fieldId,
          value: String(value),
        }));

      if (customFieldResponses.length > 0) {
        const { error: customFieldsError } = await supabase
          .from('custom_rsvp_field_responses')
          .insert(customFieldResponses);

        if (customFieldsError) {
          console.error('Error inserting custom field responses:', customFieldsError);
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        rsvp: rsvpData,
      }),
    };
  } catch (err: any) {
    console.error('Error in rsvp-submit:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

