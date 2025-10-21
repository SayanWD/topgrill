'use client'

interface ImportSourceSelectorProps {
  onSelect: (source: string) => void
}

const sources = [
  {
    id: 'csv',
    name: 'CSV/XLSX File',
    icon: '📊',
    description: 'Upload contacts from CSV or Excel file',
    available: true,
  },
  {
    id: 'amocrm',
    name: 'amoCRM',
    icon: '🟢',
    description: 'Sync contacts from amoCRM (Russian CRM)',
    available: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🟠',
    description: 'Sync contacts from HubSpot CRM',
    available: true,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '⚡',
    description: 'Import from Salesforce',
    available: true,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    icon: '🔵',
    description: 'Sync with Pipedrive',
    available: false,
  },
]

export function ImportSourceSelector({ onSelect }: ImportSourceSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Data Source</h2>
      <p className="text-sm text-gray-600">
        Choose where you want to import data from
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => source.available && onSelect(source.id)}
            disabled={!source.available}
            className={`flex items-start gap-4 rounded-lg border-2 p-6 text-left transition-all ${
              source.available
                ? 'hover:border-blue-500 hover:bg-blue-50'
                : 'cursor-not-allowed opacity-50'
            }`}
          >
            <span className="text-4xl">{source.icon}</span>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold">{source.name}</h3>
              <p className="text-sm text-gray-600">{source.description}</p>
              {!source.available && (
                <span className="mt-2 inline-block text-xs text-gray-500">
                  Coming soon
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

