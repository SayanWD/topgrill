import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { eventSchema } from '@/lib/utils/validation'
import crypto from 'crypto'

/**
 * CRM Webhook Handler - Route Handler
 * Validates signature, deduplicates, and stores events
 * 
 * Security: Uses service role key (bypasses RLS) after signature validation
 */

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
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

    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse and validate payload
    const body = JSON.parse(rawBody)
    const validated = eventSchema.parse(body)

    // Generate idempotency key if not provided
    const idempotencyKey =
      validated.idempotencyKey ||
      crypto
        .createHash('sha256')
        .update(JSON.stringify({ ...validated, timestamp: Date.now() }))
        .digest('hex')

    // Store event using service role (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Check for duplicate using idempotency key
    const { data: existing } = await supabase
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
    const { data: event, error } = await supabase
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

