import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ImportService } from '@/lib/services/import-service'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'
import { HubSpotAdapter } from '@/lib/crm-adapters/hubspot-adapter'
import { SalesforceAdapter } from '@/lib/crm-adapters/salesforce-adapter'

/**
 * Sync Integration
 * POST /api/integrations/:id/sync
 * 
 * Triggers manual sync for integration
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Create adapter based on provider
    let adapter

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    switch ((integration as any).provider) {
      case 'amocrm':
        adapter = new AmoCRMAdapter({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subdomain: (integration as any).provider_account_id!,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          accessToken: (integration as any).access_token,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          refreshToken: (integration as any).refresh_token || undefined,
          clientId: process.env.AMOCRM_CLIENT_ID,
          clientSecret: process.env.AMOCRM_CLIENT_SECRET,
          integrationId: id,
          // Callback для автоматического сохранения обновленных токенов
          onTokenRefresh: async (tokens) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('integrations')
              .update({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                expires_at: tokens.expiresAt.toISOString(),
              })
              .eq('id', id)
            
            console.log(`amoCRM tokens updated for integration ${id}`)
          },
        })
        break

      case 'hubspot':
        adapter = new HubSpotAdapter({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          accessToken: (integration as any).access_token,
        })
        break

      case 'salesforce':
        adapter = new SalesforceAdapter({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          instanceUrl: (integration as any).settings?.instanceUrl || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          accessToken: (integration as any).access_token,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        )
    }

    // Import all data types
    const importService = new ImportService()
    
    const [contactsResult, companiesResult, dealsResult] = await Promise.all([
      importService.importContacts(adapter, {
        skipDuplicates: true,
        updateExisting: true,
      }),
      importService.importCompanies(adapter, {
        skipDuplicates: true,
      }),
      importService.importDeals(adapter, {
        skipDuplicates: true,
      }),
    ])

    // Update last_sync_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      results: {
        contacts: contactsResult,
        companies: companiesResult,
        deals: dealsResult,
      },
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

