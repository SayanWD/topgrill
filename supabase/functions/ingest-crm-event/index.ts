// Supabase Edge Function for CRM event ingestion
// Alternative to Next.js API route - runs on Supabase Edge Network

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface EventPayload {
  eventName: string
  eventType: string
  source: string
  contactId?: string
  sessionId?: string
  properties?: Record<string, unknown>
  idempotencyKey?: string
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Get payload
    const payload: EventPayload = await req.json()

    // Validate required fields
    if (!payload.eventName || !payload.eventType || !payload.source) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate idempotency key
    const idempotencyKey =
      payload.idempotencyKey ||
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(payload) + Date.now())
      ).then((hash) =>
        Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      )

    // Check for duplicate
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Already processed', id: existing.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Insert event
    const { data, error } = await supabase
      .from('events')
      .insert({
        event_name: payload.eventName,
        event_type: payload.eventType,
        source: payload.source,
        contact_id: payload.contactId || null,
        session_id: payload.sessionId || null,
        properties: payload.properties || {},
        idempotency_key: idempotencyKey,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Event ingested', id: data.id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

