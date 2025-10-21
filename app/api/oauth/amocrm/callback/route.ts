import { NextRequest, NextResponse } from 'next/server'
import { exchangeAmoCRMCode } from '@/lib/crm-adapters/amocrm-adapter'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * amoCRM OAuth Callback
 * GET /api/oauth/amocrm/callback?code=xxx&state=xxx
 * 
 * Handles OAuth redirect from amoCRM
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/import?error=${error}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: 'Missing code or state' },
      { status: 400 }
    )
  }

  // Verify state (CSRF protection)
  const savedState = request.cookies.get('amocrm_oauth_state')?.value
  if (state !== savedState) {
    return NextResponse.json(
      { error: 'Invalid state parameter' },
      { status: 400 }
    )
  }

  try {
    // Exchange code for access token
    const tokens = await exchangeAmoCRMCode({
      code,
      clientId: process.env.AMOCRM_CLIENT_ID!,
      clientSecret: process.env.AMOCRM_CLIENT_SECRET!,
      subdomain: process.env.AMOCRM_SUBDOMAIN!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/amocrm/callback`,
    })

    // Save tokens to database (связываем с текущим пользователем)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      )
    }

    // Save integration to database
    const { error: dbError } = await supabase.from('integrations').upsert({
      user_id: user.id,
      provider: 'amocrm',
      provider_account_id: process.env.AMOCRM_SUBDOMAIN || 'topgrillkz',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      status: 'active',
      settings: {
        subdomain: process.env.AMOCRM_SUBDOMAIN,
        platform: searchParams.get('platform') || '1', // 1 = amocrm.ru, 2 = amocrm.com/kommo
      },
    })

    if (dbError) {
      console.error('Failed to save integration:', dbError)
      return NextResponse.redirect(
        new URL('/integrations?error=save_failed', request.url)
      )
    }

    // Redirect to integrations page with success
    const response = NextResponse.redirect(
      new URL('/integrations?amocrm=connected', request.url)
    )

    // Clear state cookie
    response.cookies.delete('amocrm_oauth_state')

    return response
  } catch (error) {
    console.error('amoCRM OAuth error:', error)
    return NextResponse.redirect(
      new URL('/import?error=oauth_failed', request.url)
    )
  }
}

