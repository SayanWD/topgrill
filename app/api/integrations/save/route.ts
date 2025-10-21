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
    const { provider, accessToken, refreshToken, instanceUrl } = body

    if (!provider || !accessToken) {
      return NextResponse.json(
        { error: 'Provider and accessToken required' },
        { status: 400 }
      )
    }

    // Save integration
    const { data, error } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider,
        provider_account_id: instanceUrl || provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        status: 'active',
        settings: { instanceUrl },
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

