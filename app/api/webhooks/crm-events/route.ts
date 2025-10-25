import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { eventSchema } from '@/lib/utils/validation'
// Use Web Crypto API for Edge Runtime compatibility

/**
 * CRM Webhook Handler - Route Handler
 * Validates signature, deduplicates, and stores events
 * 
 * Security: Uses service role key (bypasses RLS) after signature validation
 */

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-webhook-signature')
    const webhookSecret = process.env.CRM_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const rawBody = await request.text()

    if (!signature || !(await verifyWebhookSignature(rawBody, signature, webhookSecret))) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse and validate payload
    const body = JSON.parse(rawBody)
    const validated = eventSchema.parse(body)

    // Generate idempotency key if not provided
    const idempotencyKey = validated.idempotencyKey || 
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ ...validated, timestamp: Date.now() })))))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    // Store event using service role (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Check for duplicate using idempotency key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Event already processed', id: existing.id },
        { status: 200 }
      )
    }

    // Insert new event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error } = await (supabase as any)
      .from('events')
      .insert({
        event_name: validated.eventName,
        event_type: validated.eventType,
        source: validated.source,
        contact_id: validated.contactId || null,
        session_id: validated.sessionId || null,
        properties: validated.properties || {},
        idempotency_key: idempotencyKey,
      })
      .select()
      .single()

    if (error) throw error

    // Trigger downstream processing (optional)
    // - Update contact lifecycle stage
    // - Calculate attribution
    // - Send to analytics pipeline

    return NextResponse.json(
      { message: 'Event processed', id: event.id },
      { status: 201 }
    )
  } catch (err) {
    console.error('Webhook error:', err)

    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payload', details: err },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Rate limiting middleware could be added here
export const runtime = 'edge' // Use Edge Runtime for lower latency

