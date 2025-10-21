'use client'

import { useState } from 'react'

interface ConnectSalesforceProps {
  onClose: () => void
}

/**
 * Salesforce Connection Form - Client Component
 */
export function ConnectSalesforce({ onClose }: ConnectSalesforceProps) {
  const [instanceUrl, setInstanceUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    if (!instanceUrl || !accessToken) {
      alert('Please fill in all fields')
      return
    }

    setConnecting(true)

    try {
      const response = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'salesforce',
          instanceUrl,
          accessToken,
        }),
      })

      if (response.ok) {
        alert('Salesforce connected successfully!')
        window.location.reload()
      } else {
        throw new Error('Failed to save integration')
      }
    } catch (error) {
      alert('Failed to connect Salesforce')
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚡</span>
          <div>
            <h3 className="text-lg font-semibold">Connect Salesforce</h3>
            <p className="text-sm text-gray-600">
              Enterprise CRM and customer success platform
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Setup a Connected App:</strong>
          <br />
          Setup → Apps → App Manager → New Connected App
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Instance URL
        </label>
        <input
          type="url"
          value={instanceUrl}
          onChange={(e) => setInstanceUrl(e.target.value)}
          placeholder="https://your-instance.salesforce.com"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Access Token
        </label>
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="00D..."
          className="w-full rounded-md border px-3 py-2 text-sm font-mono"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConnect}
          disabled={!instanceUrl || !accessToken || connecting}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect Salesforce'}
        </button>
        <button
          onClick={onClose}
          className="rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

