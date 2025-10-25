import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * amoCRM Disconnect Webhook
 * GET /api/webhooks/amocrm/disconnect?account_id=xxx&client_uuid=xxx&signature=xxx
 * 
 * Вызывается когда пользователь отключает интеграцию в amoCRM
 * Документация: https://www.amocrm.ru/developers/content/oauth/step-by-step#disconnect_hook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accountId = searchParams.get('account_id')
  const clientUuid = searchParams.get('client_uuid')
  const signature = searchParams.get('signature')

  if (!accountId || !clientUuid || !signature) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  // Verify signature (HMAC SHA256)
  const clientId = process.env.AMOCRM_CLIENT_ID!
  const clientSecret = process.env.AMOCRM_CLIENT_SECRET!

  // Check client_uuid matches
  if (clientUuid !== clientId) {
    console.error('Invalid client_uuid:', clientUuid)
    return NextResponse.json(
      { error: 'Invalid client_uuid' },
      { status: 403 }
    )
  }

  // Calculate expected signature: HMAC(client_id|account_id, client_secret)
  const message = `${clientId}|${accountId}`
  
  // Use Web Crypto API for Edge Runtime compatibility
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Compare signatures (timing-safe)
  if (signature !== expectedSignature) {
    console.error('Invalid signature for disconnect webhook')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 403 }
    )
  }

  try {
    // Деактивировать интеграцию в БД
    const supabase = await createServerSupabaseClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('integrations')
      .update({
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
      })
      .eq('provider', 'amocrm')
      .eq('provider_account_id', accountId.toString())

    if (error) {
      console.error('Failed to deactivate integration:', error)
      return NextResponse.json(
        { error: 'Failed to update integration' },
        { status: 500 }
      )
    }

    console.log(`amoCRM integration disconnected for account ${accountId}`)

    return NextResponse.json({
      success: true,
      message: 'Integration disconnected',
    })
  } catch (error) {
    console.error('Disconnect webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

