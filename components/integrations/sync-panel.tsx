'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SyncResult {
  integration_id: string
  provider: string
  synced: number
  facebook_sent: number
}

interface SyncResponse {
  message: string
  total_synced: number
  total_facebook_sent: number
  results: SyncResult[]
}

export function SyncPanel() {
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResponse | null>(null)

  const handleManualSync = async () => {
    setIsManualSyncing(true)
    setLastSyncResult(null)

    try {
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setLastSyncResult(result)
        toast.success(`Sync completed! Synced: ${result.total_synced}, Facebook: ${result.total_facebook_sent}`)
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Sync failed')
    } finally {
      setIsManualSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Data Synchronization
        </CardTitle>
        <CardDescription>
          Sync data from your CRM systems and send successful deals to Facebook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto Sync Status */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Auto Sync</p>
              <p className="text-sm text-muted-foreground">
                Automatically syncs every 10 minutes
              </p>
            </div>
          </div>
          <Badge variant="secondary">Active</Badge>
        </div>

        {/* Manual Sync */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Play className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Manual Sync</p>
              <p className="text-sm text-muted-foreground">
                Sync data from the last 24 hours
              </p>
            </div>
          </div>
          <Button 
            onClick={handleManualSync} 
            disabled={isManualSyncing}
            size="sm"
          >
            {isManualSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </Button>
        </div>

        {/* Last Sync Results */}
        {lastSyncResult && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-3 font-medium">Last Sync Results</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Total Synced:</span>
                <Badge variant="outline">{lastSyncResult.total_synced}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Facebook Events:</span>
                <Badge variant="outline">{lastSyncResult.total_facebook_sent}</Badge>
              </div>
              {lastSyncResult.results.map((result, index) => (
                <div key={index} className="flex justify-between text-xs text-muted-foreground">
                  <span>{result.provider}:</span>
                  <span>{result.synced} synced, {result.facebook_sent} to FB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Info */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">How it works</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Automatically syncs new contacts and deals every 10 minutes</li>
            <li>• Successful deals are automatically sent to Facebook</li>
            <li>• Duplicate events are prevented with built-in deduplication</li>
            <li>• All sync activities are logged for monitoring</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
