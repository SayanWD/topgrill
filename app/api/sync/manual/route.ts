import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'
import { FacebookAPI } from '@/lib/facebook/facebook-api'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // Получаем все активные интеграции
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('status', 'active')

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError)
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ 
        message: 'No active integrations found',
        synced: 0,
        facebook_sent: 0
      })
    }

    let totalSynced = 0
    let totalFacebookSent = 0
    const results = []

    for (const integration of integrations) {
      try {
        let adapter
        
        // Создаем адаптер в зависимости от провайдера
        switch (integration.provider) {
          case 'amocrm':
            adapter = new AmoCRMAdapter({
              subdomain: integration.provider_account_id!,
              accessToken: integration.access_token,
              refreshToken: integration.refresh_token || undefined,
              clientId: process.env.AMOCRM_CLIENT_ID,
              clientSecret: process.env.AMOCRM_CLIENT_SECRET,
              integrationId: integration.id,
              onTokenRefresh: async (tokens) => {
                await supabase
                  .from('integrations')
                  .update({
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    expires_at: tokens.expiresAt.toISOString(),
                  })
                  .eq('id', integration.id)
              },
            })
            break
          default:
            console.log(`Unsupported provider: ${integration.provider}`)
            continue
        }

        // Получаем данные за последние 24 часа для ручной синхронизации
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        // Получаем контакты
        const contacts = await adapter.getContacts({
          limit: 500,
          updated_since: oneDayAgo.toISOString()
        })

        // Получаем сделки
        const deals = await adapter.getDeals({
          limit: 500,
          updated_since: oneDayAgo.toISOString()
        })

        let syncedCount = 0
        let facebookSentCount = 0

        // Сохраняем контакты
        for (const contact of contacts) {
          try {
            const { error: contactError } = await supabase
              .from('contacts')
              .upsert({
                id: `${integration.provider}_contact_${contact.id}`,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                source: integration.provider,
                raw_data: contact.rawData,
                created_at: contact.createdAt,
                updated_at: contact.updatedAt
              })

            if (!contactError) {
              syncedCount++
            }
          } catch (error) {
            console.error('Error saving contact:', error)
          }
        }

        // Сохраняем сделки
        for (const deal of deals) {
          try {
            const { error: dealError } = await supabase
              .from('deals')
              .upsert({
                id: `${integration.provider}_deal_${deal.id}`,
                name: deal.name,
                amount: deal.amount,
                currency: deal.currency || 'USD',
                stage: deal.stage,
                probability: deal.probability,
                close_date: deal.closeDate?.toISOString(),
                source: integration.provider,
                raw_data: deal.rawData,
                created_at: deal.createdAt,
                updated_at: deal.updatedAt
              })

            if (!dealError) {
              syncedCount++
            }
          } catch (error) {
            console.error('Error saving deal:', error)
          }
        }

        // Проверяем успешные сделки для отправки в Facebook
        const successfulDeals = deals.filter(deal => 
          deal.stage === 'closed-won' || deal.stage === 'success'
        )

        if (successfulDeals.length > 0) {
          const facebookAPI = new FacebookAPI()
          
          for (const deal of successfulDeals) {
            try {
              // Проверяем, не отправляли ли мы уже это событие
              const { data: existingEvent } = await supabase
                .from('lead_events')
                .select('id')
                .eq('lead_id', `${integration.provider}_deal_${deal.id}`)
                .eq('event_type', 'conversion')
                .single()

              if (existingEvent) {
                continue // Уже отправляли
              }

              // Отправляем событие конверсии в Facebook
              const facebookResult = await facebookAPI.sendConversionEvent({
                eventName: 'Purchase',
                value: deal.amount,
                currency: deal.currency || 'USD',
                email: deal.contact?.email,
                phone: deal.contact?.phone,
                firstName: deal.contact?.firstName,
                lastName: deal.contact?.lastName,
                customData: {
                  deal_id: deal.id,
                  deal_name: deal.name,
                  source: 'manual_sync'
                }
              })

              if (facebookResult.success) {
                facebookSentCount++
                
                // Сохраняем событие в базу
                await supabase
                  .from('lead_events')
                  .insert({
                    lead_id: `${integration.provider}_deal_${deal.id}`,
                    event_type: 'conversion',
                    event_data: {
                      deal_id: deal.id,
                      amount: deal.amount,
                      facebook_sent: true,
                      timestamp: new Date().toISOString()
                    }
                  })
              }
            } catch (error) {
              console.error('Error sending to Facebook:', error)
            }
          }
        }

        // Обновляем время последней синхронизации
        await supabase
          .from('integrations')
          .update({ 
            last_sync_at: new Date().toISOString(),
            last_error: null
          })
          .eq('id', integration.id)

        results.push({
          integration_id: integration.id,
          provider: integration.provider,
          synced: syncedCount,
          facebook_sent: facebookSentCount
        })

        totalSynced += syncedCount
        totalFacebookSent += facebookSentCount

      } catch (error) {
        console.error(`Error syncing integration ${integration.id}:`, error)
        
        // Сохраняем ошибку
        await supabase
          .from('integrations')
          .update({ 
            last_error: error instanceof Error ? error.message : 'Unknown error',
            last_sync_at: new Date().toISOString()
          })
          .eq('id', integration.id)
      }
    }

    return NextResponse.json({
      message: 'Manual sync completed',
      total_synced: totalSynced,
      total_facebook_sent: totalFacebookSent,
      results
    })

  } catch (error) {
    console.error('Manual sync error:', error)
    return NextResponse.json(
      { error: 'Manual sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
