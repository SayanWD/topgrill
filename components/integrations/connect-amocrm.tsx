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
  const [accessCode, setAccessCode] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'token'>('oauth')

  const handleOAuthConnect = () => {
    if (!subdomain) {
      alert('Please enter your amoCRM subdomain')
      return
    }

    setConnecting(true)

    // Redirect to OAuth flow
    window.location.href = `/api/oauth/amocrm?subdomain=${subdomain}`
  }

  const handleTokenConnect = async () => {
    if (!subdomain || !accessCode) {
      alert('Please enter both subdomain and access code')
      return
    }

    setConnecting(true)

    try {
      const response = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'amocrm',
          credentials: {
            subdomain,
            accessToken: accessCode,
            tokenType: 'long_term'
          }
        })
      })

      if (response.ok) {
        alert('amoCRM connected successfully!')
        onClose()
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Connection failed: ${error.error}`)
      }
    } catch (error) {
      alert(`Connection failed: ${error}`)
    } finally {
      setConnecting(false)
    }
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
          <strong>Setup Instructions:</strong>
        </p>
        <ol className="mt-2 list-decimal list-inside text-sm text-blue-900 space-y-1">
          <li>Go to your amoCRM account</li>
          <li>Navigate to Settings → API</li>
          <li>Create a new integration</li>
          <li>Copy the Client ID and Secret</li>
          <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">https://nanosudo.com/api/oauth/amocrm/callback</code></li>
        </ol>
      </div>

      <div className="space-y-4">
        {/* Connection Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Method
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="oauth"
                checked={connectionMethod === 'oauth'}
                onChange={(e) => setConnectionMethod(e.target.value as 'oauth' | 'token')}
                className="mr-2"
              />
              OAuth (Recommended)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="token"
                checked={connectionMethod === 'token'}
                onChange={(e) => setConnectionMethod(e.target.value as 'oauth' | 'token')}
                className="mr-2"
              />
              Access Code (20 min)
            </label>
          </div>
        </div>

        {/* Subdomain Input */}
        <div>
          <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
            amoCRM Subdomain
          </label>
          <input
            id="subdomain"
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="your-company"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter your amoCRM subdomain (e.g., your-company.amocrm.ru)
          </p>
        </div>

        {/* Access Code Input (for token method) */}
        {connectionMethod === 'token' && (
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
              Access Code (20 minutes)
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter your 20-minute access code"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get this code from amoCRM → Settings → API → Access Code (valid for 20 minutes)
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={connectionMethod === 'oauth' ? handleOAuthConnect : handleTokenConnect}
          disabled={connecting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  )
}