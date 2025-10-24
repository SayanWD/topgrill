import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Save Integration
 * POST /api/integrations/save
 * 
 * Saves CRM integration credentials
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, credentials } = body

    if (!platform || !credentials) {
      return NextResponse.json(
        { error: 'Platform and credentials required' },
        { status: 400 }
      )
    }

    // Validate credentials based on platform
    let validatedCredentials: Record<string, unknown> = {}

    switch (platform) {
      case 'hubspot':
        if (!credentials.accessToken) {
          return NextResponse.json(
            { error: 'HubSpot access token required' },
            { status: 400 }
          )
        }
        validatedCredentials = {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
        }
        break

      case 'salesforce':
        if (!credentials.accessToken || !credentials.instanceUrl) {
          return NextResponse.json(
            { error: 'Salesforce access token and instance URL required' },
            { status: 400 }
          )
        }
        validatedCredentials = {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          instanceUrl: credentials.instanceUrl,
          expiresAt: credentials.expiresAt,
        }
        break

      case 'amocrm':
        if (!credentials.accessToken || !credentials.subdomain) {
          return NextResponse.json(
            { error: 'amoCRM access token and subdomain required' },
            { status: 400 }
          )
        }
        validatedCredentials = {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          subdomain: credentials.subdomain,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          tokenType: credentials.tokenType || 'oauth',
          expiresAt: credentials.expiresAt,
        }
        break

      default:
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 400 }
        )
    }

    // Save integration
    const { data, error } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        platform,
        provider_account_id: credentials.subdomain || credentials.instanceUrl || platform,
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        status: 'active',
        settings: validatedCredentials,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      integration: data,
    })
  } catch (error) {
    console.error('Save integration error:', error)
    return NextResponse.json(
      { error: 'Failed to save integration' },
      { status: 500 }
    )
  }
}