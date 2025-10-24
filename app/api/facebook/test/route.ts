import { NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook/facebook-api'

/**
 * Test Facebook API Connection
 * GET /api/facebook/test
 */
export async function GET() {
  try {
    const accessToken = process.env.FB_CONVERSION_ACCESS_TOKEN
    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

    if (!accessToken || !pixelId) {
      return NextResponse.json(
        { 
          error: 'Facebook credentials not configured',
          details: {
            accessToken: accessToken ? '✅ Set' : '❌ Missing',
            pixelId: pixelId ? '✅ Set' : '❌ Missing'
          }
        },
        { status: 500 }
      )
    }

    const facebookAPI = new FacebookAPI(accessToken, pixelId)
    const isConnected = await facebookAPI.testConnection()

    if (!isConnected) {
      return NextResponse.json(
        { 
          error: 'Failed to connect to Facebook API',
          details: 'Check your access token and permissions'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Facebook API connection successful',
      pixelId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Facebook API test error:', error)
    
    return NextResponse.json(
      {
        error: 'Facebook API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

