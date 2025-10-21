'use client'

import { useState } from 'react'

interface ConnectAmoCRMProps {
  onClose: () => void
}

/**
 * amoCRM Connection Form - Client Component
 * OAuth flow для подключения amoCRM
 */
export function ConnectAmoCRM({ onClose }: ConnectAmoCRMProps) {
  const [subdomain, setSubdomain] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    if (!subdomain) {
      alert('Please enter your amoCRM subdomain')
      return
    }

    setConnecting(true)

    // Redirect to OAuth flow
    window.location.href = `/api/oauth/amocrm?subdomain=${subdomain}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🟢</span>
          <div>
            <h3 className="text-lg font-semibold">Connect amoCRM</h3>
            <p className="text-sm text-gray-600">
              Russian CRM platform with OAuth 2.0
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
          💡 <strong>Setup required:</strong> Create integration in your amoCRM
          account first (Settings → Integrations)
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          amoCRM Subdomain
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="yourcompany"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <span className="flex items-center text-sm text-gray-500">
            .amocrm.ru
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Example: if your amoCRM URL is https://mycompany.amocrm.ru, enter
          "mycompany"
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">What will be imported:</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>✓ Contacts with custom fields</li>
          <li>✓ Companies</li>
          <li>✓ Deals (leads)</li>
          <li>✓ Activities</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConnect}
          disabled={!subdomain || connecting}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect via OAuth'}
        </button>
        <button
          onClick={onClose}
          className="rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="mb-2 text-sm font-medium">Need help?</p>
        <a
          href="/docs/AMOCRM_SETUP.md"
          target="_blank"
          className="text-sm text-blue-600 hover:underline"
        >
          View amoCRM setup guide →
        </a>
      </div>
    </div>
  )
}

