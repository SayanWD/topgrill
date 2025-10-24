import { NextResponse } from 'next/server'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'

/**
 * Test amoCRM Data Import
 * GET /api/test/import
 */
export async function GET() {
  try {
    // Validate required environment variables
    const accessToken = process.env.AMOCRM_LONG_TERM_TOKEN
    const subdomain = process.env.AMOCRM_SUBDOMAIN

    if (!accessToken || !subdomain) {
      return NextResponse.json(
        { error: 'amoCRM credentials not configured' },
        { status: 500 }
      )
    }

    // Create amoCRM adapter
    const adapter = new AmoCRMAdapter({
      subdomain,
      accessToken,
    })

    // Test connection first
    const isConnected = await adapter.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to amoCRM' },
        { status: 500 }
      )
    }

    // Try to fetch a small amount of data
    const results = {
      connection: true,
      contacts: null as { count: number; sample: unknown } | null,
      companies: null as { count: number; sample: unknown } | null,
      leads: null as { count: number; sample: unknown } | null,
      errors: [] as string[]
    }

    try {
      // Test contacts fetch
      const contacts = await adapter.fetchContacts({ limit: 5 })
      results.contacts = {
        count: contacts.length,
        sample: contacts[0] || null
      }
    } catch (error) {
      results.errors.push(`Contacts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Test companies fetch
      const companies = await adapter.fetchCompanies({ limit: 5 })
      results.companies = {
        count: companies.length,
        sample: companies[0] || null
      }
    } catch (error) {
      results.errors.push(`Companies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Test deals fetch
      const deals = await adapter.fetchDeals({ limit: 5 })
      results.leads = {
        count: deals.length,
        sample: deals[0] || null
      }
    } catch (error) {
      results.errors.push(`Deals: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'amoCRM data fetch test completed',
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Import test error:', error)
    
    return NextResponse.json(
      {
        error: 'Import test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
