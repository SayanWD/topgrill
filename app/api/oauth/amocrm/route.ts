import { NextRequest, NextResponse } from 'next/server'
import { getAmoCRMOAuthUrl } from '@/lib/crm-adapters/amocrm-adapter'

/**
 * amoCRM OAuth Flow - Start
 * GET /api/oauth/amocrm
 * 
 * Redirects to amoCRM authorization page
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subdomainParam = searchParams.get('subdomain')
  
  const clientId = process.env.AMOCRM_CLIENT_ID
  const subdomain = subdomainParam || process.env.AMOCRM_SUBDOMAIN
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/amocrm/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'amoCRM Client ID not configured. Add AMOCRM_CLIENT_ID to .env.local' },
      { status: 500 }
    )
  }

  if (!subdomain) {
    return NextResponse.json(
      { error: 'Subdomain required. Add ?subdomain=yourcompany or configure AMOCRM_SUBDOMAIN' },
      { status: 400 }
    )
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID()

  // Store state in session/cookie for verification
  const response = NextResponse.redirect(
    getAmoCRMOAuthUrl({
      clientId,
      subdomain,
      redirectUri,
      state,
    })
  )

  // Set state cookie for verification in callback
  response.cookies.set('amocrm_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })

  return response
}

