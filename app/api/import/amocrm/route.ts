import { NextRequest, NextResponse } from 'next/server'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Import Data from amoCRM
 * POST /api/import/amocrm
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      days = 30, // Default to last 30 days
      limit = 100, // Default limit
      types = ['contacts', 'companies', 'leads'] // What to import
    } = body

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

    const supabase = await createServerSupabaseClient()
    const results = {
      contacts: { imported: 0, errors: 0 },
      companies: { imported: 0, errors: 0 },
      leads: { imported: 0, errors: 0 }
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`Importing data from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Import Contacts
    if (types.includes('contacts')) {
      try {
        console.log('Importing contacts...')
        const contacts = await adapter.fetchContacts({
          limit
        })

        for (const contact of contacts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from('contacts')
              .upsert({
                id: `amocrm_contact_${contact.id}`,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                source: 'amocrm',
                raw_data: contact.rawData,
                created_at: contact.createdAt,
                updated_at: contact.updatedAt
              })

            if (error) {
              console.error('Error saving contact:', error)
              results.contacts.errors++
            } else {
              results.contacts.imported++
            }
          } catch (error) {
            console.error('Error processing contact:', error)
            results.contacts.errors++
          }
        }
      } catch (error) {
        console.error('Error importing contacts:', error)
        results.contacts.errors++
      }
    }

    // Import Companies
    if (types.includes('companies')) {
      try {
        console.log('Importing companies...')
        const companies = await adapter.fetchCompanies({
          limit
        })

        for (const company of companies) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from('companies')
              .upsert({
                id: `amocrm_company_${company.id}`,
                name: company.name,
                industry: company.industry,
                website: company.website,
                source: 'amocrm',
                raw_data: company.rawData,
                created_at: company.createdAt,
                updated_at: company.updatedAt
              })

            if (error) {
              console.error('Error saving company:', error)
              results.companies.errors++
            } else {
              results.companies.imported++
            }
          } catch (error) {
            console.error('Error processing company:', error)
            results.companies.errors++
          }
        }
      } catch (error) {
        console.error('Error importing companies:', error)
        results.companies.errors++
      }
    }

    // Import Leads/Deals
    if (types.includes('leads')) {
      try {
        console.log('Importing leads...')
        const deals = await adapter.fetchDeals({
          limit
        })

        for (const deal of deals) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from('leads')
              .upsert({
                id: `amocrm_deal_${deal.id}`,
                status: deal.status,
                email: deal.email,
                phone: deal.phone,
                first_name: deal.firstName,
                last_name: deal.lastName,
                value: deal.value,
                facebook_sent: false,
                custom_data: deal.rawData,
                created_at: deal.createdAt,
                updated_at: deal.updatedAt
              })

            if (error) {
              console.error('Error saving lead:', error)
              results.leads.errors++
            } else {
              results.leads.imported++
            }
          } catch (error) {
            console.error('Error processing lead:', error)
            results.leads.errors++
          }
        }
      } catch (error) {
        console.error('Error importing leads:', error)
        results.leads.errors++
      }
    }

    // Log import event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('import_logs')
      .insert({
        source: 'amocrm',
        status: 'completed',
        records_imported: results.contacts.imported + results.companies.imported + results.leads.imported,
        records_failed: results.contacts.errors + results.companies.errors + results.leads.errors,
        details: results,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Data import completed',
      results,
      summary: {
        total_imported: results.contacts.imported + results.companies.imported + results.leads.imported,
        total_errors: results.contacts.errors + results.companies.errors + results.leads.errors,
        date_range: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          days
        }
      }
    })
  } catch (error) {
    console.error('Import error:', error)
    
    return NextResponse.json(
      {
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
