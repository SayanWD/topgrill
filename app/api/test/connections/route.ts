import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'
import { FacebookAPI } from '@/lib/facebook/facebook-api'

/**
 * Test All CRM Connections
 * GET /api/test/connections
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as Record<string, { status: string; message: string; details?: string | null }>,
    overall: {} as { status: string; message: string; summary: { total: number; successful: number; failed: number } }
  }

  // Test 1: Supabase Connection
  try {
    const supabase = await createServerSupabaseClient()
        const { error } = await supabase.from('contacts').select('count').limit(1)
    
    results.tests.supabase = {
      status: error ? 'error' : 'success',
      message: error ? error.message : 'Connected to Supabase',
      details: error ? null : 'Database accessible'
    }
  } catch (error) {
    results.tests.supabase = {
      status: 'error',
      message: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 2: amoCRM Connection
  try {
    if (!process.env.AMOCRM_LONG_TERM_TOKEN) {
      results.tests.amocrm = {
        status: 'error',
        message: 'AMOCRM_LONG_TERM_TOKEN not configured',
        details: 'Add AMOCRM_LONG_TERM_TOKEN to .env.local'
      }
    } else {
      const adapter = new AmoCRMAdapter({
        subdomain: 'topgrillkz',
        accessToken: process.env.AMOCRM_LONG_TERM_TOKEN,
      })

      const isConnected = await adapter.testConnection()
      
      results.tests.amocrm = {
        status: isConnected ? 'success' : 'error',
        message: isConnected ? 'Connected to amoCRM' : 'Failed to connect to amoCRM',
        details: isConnected ? 'API accessible' : 'Check token validity'
      }
    }
  } catch (error) {
    results.tests.amocrm = {
      status: 'error',
      message: 'amoCRM connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 3: Facebook API Connection
  try {
    const accessToken = process.env.FB_CONVERSION_ACCESS_TOKEN
    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

    if (!accessToken || !pixelId) {
      results.tests.facebook = {
        status: 'error',
        message: 'Facebook credentials not configured',
        details: `Access Token: ${accessToken ? 'Set' : 'Missing'}, Pixel ID: ${pixelId ? 'Set' : 'Missing'}`
      }
    } else {
      const facebookAPI = new FacebookAPI(accessToken, pixelId)
      const isConnected = await facebookAPI.testConnection()
      
      results.tests.facebook = {
        status: isConnected ? 'success' : 'error',
        message: isConnected ? 'Connected to Facebook API' : 'Failed to connect to Facebook API',
        details: isConnected ? 'API accessible' : 'Check token validity and permissions'
      }
    }
  } catch (error) {
    results.tests.facebook = {
      status: 'error',
      message: 'Facebook API connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 4: Environment Variables
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    AMOCRM_SUBDOMAIN: !!process.env.AMOCRM_SUBDOMAIN,
    AMOCRM_CLIENT_ID: !!process.env.AMOCRM_CLIENT_ID,
    AMOCRM_CLIENT_SECRET: !!process.env.AMOCRM_CLIENT_SECRET,
    AMOCRM_LONG_TERM_TOKEN: !!process.env.AMOCRM_LONG_TERM_TOKEN,
    NEXT_PUBLIC_FB_PIXEL_ID: !!process.env.NEXT_PUBLIC_FB_PIXEL_ID,
    FB_CONVERSION_ACCESS_TOKEN: !!process.env.FB_CONVERSION_ACCESS_TOKEN,
  }

  results.tests.environment = {
    status: Object.values(envCheck).every(Boolean) ? 'success' : 'warning',
    message: 'Environment variables check',
    details: JSON.stringify(envCheck)
  }

  // Calculate overall status
  const successCount = Object.values(results.tests).filter(test => test.status === 'success').length
  const totalTests = Object.keys(results.tests).length
  
  results.overall = {
    status: successCount === totalTests ? 'success' : successCount > 0 ? 'partial' : 'error',
    message: `${successCount}/${totalTests} connections successful`,
    summary: {
      total: totalTests,
      successful: successCount,
      failed: totalTests - successCount
    }
  }

  return NextResponse.json(results)
}
