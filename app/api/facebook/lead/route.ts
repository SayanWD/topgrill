import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI, FacebookLeadData } from '@/lib/facebook/facebook-api'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Update Lead Status and Send to Facebook
 * POST /api/facebook/lead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, status, email, phone, firstName, lastName, value, customData } = body

    // Validate required fields
    if (!leadId || !status) {
      return NextResponse.json(
        { error: 'leadId and status are required' },
        { status: 400 }
      )
    }

    const accessToken = process.env.FB_CONVERSION_ACCESS_TOKEN
    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

    if (!accessToken || !pixelId) {
      return NextResponse.json(
        { error: 'Facebook credentials not configured' },
        { status: 500 }
      )
    }

    // Prepare Facebook lead data
    const facebookLeadData: FacebookLeadData = {
      leadId,
      status,
      email,
      phone,
      firstName,
      lastName,
      value,
      customData
    }

    // Send to Facebook
    const facebookAPI = new FacebookAPI(accessToken, pixelId)
    const facebookSuccess = await facebookAPI.updateLeadStatus(facebookLeadData)

    // Save to database
    const supabase = await createServerSupabaseClient()
    
    // Update or create lead record
    const { data: _lead, error: leadError } = await supabase
      .from('leads')
      .upsert({
        id: leadId,
        status,
        email,
        phone,
        first_name: firstName,
        last_name: lastName,
        value,
        facebook_sent: facebookSuccess,
        custom_data: customData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (leadError) {
      console.error('Database error:', leadError)
      return NextResponse.json(
        { 
          error: 'Failed to save lead to database',
          details: leadError.message
        },
        { status: 500 }
      )
    }

    // Log the event
    const { error: logError } = await supabase
      .from('lead_events')
      .insert({
        lead_id: leadId,
        event_type: 'status_update',
        event_data: {
          status,
          facebook_sent: facebookSuccess,
          timestamp: new Date().toISOString()
        }
      })

    if (logError) {
      console.error('Event logging error:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Lead status updated successfully',
      data: {
        leadId,
        status,
        facebookSent: facebookSuccess,
        databaseSaved: true,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Lead update error:', error)
    
    return NextResponse.json(
      {
        error: 'Lead update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

