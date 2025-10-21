'use client'

import { useState } from 'react'
import { formatRelative } from '@/lib/utils/dates'

interface Integration {
  id: string
  provider: string
  provider_account_id: string | null
  status: string
  last_sync_at: string | null
  created_at: string
}

interface IntegrationsListProps {
  integrations: Integration[]
}

const providerMeta: Record<string, { icon: string; name: string; color: string }> = {
  amocrm: { icon: '🟢', name: 'amoCRM', color: 'green' },
  hubspot: { icon: '🟠', name: 'HubSpot', color: 'orange' },
  salesforce: { icon: '⚡', name: 'Salesforce', color: 'blue' },
  csv: { icon: '📊', name: 'CSV Import', color: 'gray' },
}

/**
 * Integrations List - Client Component
 * Показывает подключенные CRM системы
 */
export function IntegrationsList({ integrations }: IntegrationsListProps) {
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)

    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Sync started! Check Import page for progress.')
        window.location.reload()
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      alert('Failed to start sync')
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this CRM?')) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      alert('Failed to disconnect')
    }
  }

  if (integrations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">No CRM systems connected yet</p>
        <p className="mt-2 text-sm text-gray-400">
          Connect your first CRM above to start importing data
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {integrations.map((integration) => {
        const meta = providerMeta[integration.provider] || {
          icon: '📦',
          name: integration.provider,
          color: 'gray',
        }

        return (
          <div
            key={integration.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{meta.icon}</span>
              <div>
                <h3 className="font-semibold">{meta.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      integration.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {integration.status === 'active' ? '● Active' : '○ Inactive'}
                  </span>
                  {integration.provider_account_id && (
                    <span className="text-xs text-gray-500">
                      {integration.provider_account_id}
                    </span>
                  )}
                </div>
                {integration.last_sync_at && (
                  <p className="mt-1 text-xs text-gray-500">
                    Last sync: {formatRelative(integration.last_sync_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSync(integration.id)}
                disabled={syncing === integration.id}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {syncing === integration.id ? 'Syncing...' : '🔄 Sync Now'}
              </button>
              <button
                onClick={() => handleDisconnect(integration.id)}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

