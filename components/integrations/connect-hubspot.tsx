'use client'

import { useState } from 'react'

interface ConnectHubSpotProps {
  onClose: () => void
}

/**
 * HubSpot Connection Form - Client Component
 */
export function ConnectHubSpot({ onClose }: ConnectHubSpotProps) {
  const [accessToken, setAccessToken] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    if (!accessToken) {
      alert('Please enter your HubSpot access token')
      return
    }

    setConnecting(true)

    try {
      // Save integration
      const response = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'hubspot',
          accessToken,
        }),
      })

      if (response.ok) {
        alert('HubSpot connected successfully!')
        window.location.reload()
      } else {
        throw new Error('Failed to save integration')
      }
    } catch (error) {
      alert('Failed to connect HubSpot')
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🟠</span>
          <div>
            <h3 className="text-lg font-semibold">Connect HubSpot</h3>
            <p className="text-sm text-gray-600">
              All-in-one CRM, Marketing, and Sales platform
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

      <div className="rounded-lg bg-orange-50 p-4">
        <p className="text-sm text-orange-900">
          <strong>Get your Private App Access Token:</strong>
          <br />
          Settings → Integrations → Private Apps → Create private app
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Private App Access Token
        </label>
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="pat-na1-..."
          className="w-full rounded-md border px-3 py-2 text-sm font-mono"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your token will be encrypted and stored securely
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Required scopes:</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>✓ crm.objects.contacts.read</li>
          <li>✓ crm.objects.companies.read</li>
          <li>✓ crm.objects.deals.read</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConnect}
          disabled={!accessToken || connecting}
          className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect HubSpot'}
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

