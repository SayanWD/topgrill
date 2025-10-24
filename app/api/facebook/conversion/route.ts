import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI, FacebookLeadData } from '@/lib/facebook/facebook-api'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Send Conversion Event to Facebook
 * POST /api/facebook/conversion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      eventType, // 'lead', 'purchase', 'custom'
      leadId, 
      email, 
      phone, 
      firstName, 
      lastName, 
      value, 
      customData 
    } = body

    // Validate required fields
    if (!eventType || !leadId) {
      return NextResponse.json(
        { error: 'eventType and leadId are required' },
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
      email,
      phone,
      firstName,
      lastName,
      value,
      customData
    }

    // Send to Facebook based on event type
    const facebookAPI = new FacebookAPI(accessToken, pixelId)
    let facebookSuccess = false

    switch (eventType) {
      case 'lead':
        facebookSuccess = await facebookAPI.sendLeadConversion(facebookLeadData)
        break
      case 'purchase':
        facebookSuccess = await facebookAPI.sendPurchaseConversion(facebookLeadData)
        break
      default:
        facebookSuccess = await facebookAPI.updateLeadStatus({
          ...facebookLeadData,
          status: eventType
        })
    }

    // Save to database
    const supabase = await createServerSupabaseClient()
    
    // Update lead record
    const { data: _lead, error: leadError } = await supabase
      .from('leads')
      .upsert({
        id: leadId,
        status: eventType,
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

    // Log the conversion event
    const { error: logError } = await supabase
      .from('lead_events')
      .insert({
        lead_id: leadId,
        event_type: 'conversion',
        event_data: {
          eventType,
          facebook_sent: facebookSuccess,
          value,
          timestamp: new Date().toISOString()
        }
      })

    if (logError) {
      console.error('Event logging error:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Conversion event '${eventType}' sent successfully`,
      data: {
        leadId,
        eventType,
        facebookSent: facebookSuccess,
        databaseSaved: true,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Conversion event error:', error)
    
    return NextResponse.json(
      {
        error: 'Conversion event failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

