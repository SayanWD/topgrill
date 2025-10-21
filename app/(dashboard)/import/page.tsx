import { ImportWizard } from '@/components/import/import-wizard'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

/**
 * Import Page - Server Component
 * UI для импорта данных из CRM систем
 */

export default async function ImportPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground">
            Import contacts, companies, and deals from any CRM system
          </p>
        </div>
        <ArrowDownTrayIcon className="h-12 w-12 text-gray-400" />
      </div>

      {/* Supported CRMs */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Supported Sources</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { name: 'HubSpot', icon: '🟠' },
            { name: 'Salesforce', icon: '⚡' },
            { name: 'CSV/XLSX', icon: '📊' },
            { name: 'Pipedrive', icon: '🔵', soon: true },
          ].map((crm) => (
            <div
              key={crm.name}
              className="flex items-center gap-3 rounded-lg border p-4"
            >
              <span className="text-3xl">{crm.icon}</span>
              <div>
                <p className="font-medium">{crm.name}</p>
                {crm.soon && (
                  <p className="text-xs text-gray-500">Coming soon</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Wizard */}
      <ImportWizard />

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 text-2xl">🔄</div>
          <h3 className="mb-2 font-semibold">Automatic Deduplication</h3>
          <p className="text-sm text-gray-600">
            Automatically detects and skips duplicate records based on email
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 text-2xl">🗺️</div>
          <h3 className="mb-2 font-semibold">Smart Field Mapping</h3>
          <p className="text-sm text-gray-600">
            AI-powered field detection for CSV imports
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 text-2xl">✅</div>
          <h3 className="mb-2 font-semibold">Data Validation</h3>
          <p className="text-sm text-gray-600">
            Validates all data before import with detailed error reports
          </p>
        </div>
      </div>
    </div>
  )
}

