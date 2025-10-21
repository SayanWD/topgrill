import { NextRequest, NextResponse } from 'next/server'
import { ImportService } from '@/lib/services/import-service'
import { HubSpotAdapter } from '@/lib/crm-adapters/hubspot-adapter'
import { SalesforceAdapter } from '@/lib/crm-adapters/salesforce-adapter'
import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'
import { CSVAdapter, parseCSV } from '@/lib/crm-adapters/csv-adapter'
import { requireRole } from '@/lib/auth/rbac'

/**
 * CRM Import API
 * POST /api/import/crm
 * 
 * Body:
 * {
 *   "source": "hubspot" | "salesforce" | "csv",
 *   "type": "contacts" | "companies" | "deals",
 *   "credentials": { ... },
 *   "options": { ... }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Require analyst или admin роль
    await requireRole(['analyst', 'admin'])

    const body = await request.json()
    const { source, type, credentials, options = {} } = body

    if (!source || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: source, type' },
        { status: 400 }
      )
    }

    // Создаем адаптер в зависимости от источника
    let adapter

    switch (source) {
      case 'hubspot':
        if (!credentials?.accessToken) {
          return NextResponse.json(
            { error: 'HubSpot access token required' },
            { status: 400 }
          )
        }
        adapter = new HubSpotAdapter({ accessToken: credentials.accessToken })
        break

      case 'salesforce':
        if (!credentials?.accessToken || !credentials?.instanceUrl) {
          return NextResponse.json(
            { error: 'Salesforce credentials required' },
            { status: 400 }
          )
        }
        adapter = new SalesforceAdapter({
          accessToken: credentials.accessToken,
          instanceUrl: credentials.instanceUrl,
        })
        break

      case 'amocrm':
        if (!credentials?.accessToken || !credentials?.subdomain) {
          return NextResponse.json(
            { error: 'amoCRM credentials required (accessToken, subdomain)' },
            { status: 400 }
          )
        }
        adapter = new AmoCRMAdapter({
          subdomain: credentials.subdomain,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
        })
        break

      case 'csv':
        if (!credentials?.csvData || !credentials?.mapping) {
          return NextResponse.json(
            { error: 'CSV data and mapping required' },
            { status: 400 }
          )
        }
        const rows = parseCSV(credentials.csvData)
        adapter = new CSVAdapter({
          data: rows,
          mapping: credentials.mapping,
        })
        break

      default:
        return NextResponse.json(
          { error: `Unsupported source: ${source}` },
          { status: 400 }
        )
    }

    // Проверяем подключение
    const isConnected = await adapter.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to CRM' },
        { status: 400 }
      )
    }

    // Запускаем импорт
    const importService = new ImportService()
    let result

    switch (type) {
      case 'contacts':
        result = await importService.importContacts(adapter, options)
        break
      case 'companies':
        result = await importService.importCompanies(adapter, options)
        break
      case 'deals':
        result = await importService.importDeals(adapter, options)
        break
      default:
        return NextResponse.json(
          { error: `Unsupported type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Imported ${result.imported} ${type}, skipped ${result.skipped}, failed ${result.failed}`,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      {
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Test CRM connection
 * POST /api/import/crm/test
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['analyst', 'admin'])

    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source')

    if (!source) {
      return NextResponse.json(
        { error: 'Source parameter required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      supported: ['hubspot', 'salesforce', 'csv', 'pipedrive'],
      message: `Testing ${source} connection...`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}

