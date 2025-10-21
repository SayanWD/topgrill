'use client'

import { useState } from 'react'
import { ConnectAmoCRM } from './connect-amocrm'
import { ConnectHubSpot } from './connect-hubspot'
import { ConnectSalesforce } from './connect-salesforce'

const availableCRMs = [
  {
    id: 'amocrm',
    name: 'amoCRM',
    icon: '🟢',
    description: 'Russian CRM platform',
    available: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🟠',
    description: 'All-in-one CRM platform',
    available: true,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '⚡',
    description: 'Enterprise CRM solution',
    available: true,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    icon: '🔵',
    description: 'Sales pipeline CRM',
    available: false,
  },
]

/**
 * Connect CRM Panel - Client Component
 * UI для подключения новых CRM систем
 */
export function ConnectCRMPanel() {
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null)

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold">Connect New CRM</h2>

      {/* CRM Selection */}
      {!selectedCRM && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {availableCRMs.map((crm) => (
            <button
              key={crm.id}
              onClick={() => crm.available && setSelectedCRM(crm.id)}
              disabled={!crm.available}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                crm.available
                  ? 'hover:border-blue-500 hover:bg-blue-50'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="mb-2 text-3xl">{crm.icon}</div>
              <h3 className="mb-1 font-semibold">{crm.name}</h3>
              <p className="text-xs text-gray-600">{crm.description}</p>
              {!crm.available && (
                <span className="mt-2 inline-block text-xs text-gray-500">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Connection Forms */}
      {selectedCRM === 'amocrm' && (
        <ConnectAmoCRM onClose={() => setSelectedCRM(null)} />
      )}
      {selectedCRM === 'hubspot' && (
        <ConnectHubSpot onClose={() => setSelectedCRM(null)} />
      )}
      {selectedCRM === 'salesforce' && (
        <ConnectSalesforce onClose={() => setSelectedCRM(null)} />
      )}
    </div>
  )
}

