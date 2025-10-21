import { NextResponse } from 'next/server'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'

/**
 * Test amoCRM Connection
 * GET /api/test/amocrm
 * 
 * Быстрый тест подключения к amoCRM с long-term token
 */
export async function GET() {
  try {
    // Проверка наличия токена
    if (!process.env.AMOCRM_LONG_TERM_TOKEN) {
      return NextResponse.json(
        { 
          error: 'AMOCRM_LONG_TERM_TOKEN not configured',
          hint: 'Add AMOCRM_LONG_TERM_TOKEN to .env.local'
        },
        { status: 500 }
      )
    }

    // Создаем adapter с долгосрочным токеном
    const adapter = new AmoCRMAdapter({
      subdomain: 'topgrillkz',
      accessToken: process.env.AMOCRM_LONG_TERM_TOKEN,
    })

    // Тест подключения
    const isConnected = await adapter.testConnection()
    
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to amoCRM' },
        { status: 500 }
      )
    }

    // Получаем первые 5 контактов
    const contacts = await adapter.fetchContacts({ limit: 5 })
    
    // Получаем первые 5 компаний
    const companies = await adapter.fetchCompanies({ limit: 5 })
    
    // Получаем первые 5 сделок
    const deals = await adapter.fetchDeals({ limit: 5 })

    // Получаем общее количество
    const [contactsTotal, companiesTotal, dealsTotal] = await Promise.all([
      adapter.getTotalCount('contacts'),
      adapter.getTotalCount('companies'),
      adapter.getTotalCount('deals'),
    ])

    return NextResponse.json({
      success: true,
      connection: 'OK',
      subdomain: 'topgrillkz',
      data: {
        contacts: {
          total: contactsTotal,
          sample: contacts.length,
          items: contacts,
        },
        companies: {
          total: companiesTotal,
          sample: companies.length,
          items: companies,
        },
        deals: {
          total: dealsTotal,
          sample: deals.length,
          items: deals,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('amoCRM test error:', error)
    
    return NextResponse.json(
      {
        error: 'amoCRM API error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

