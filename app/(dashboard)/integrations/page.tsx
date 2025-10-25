import { createServerSupabaseClient } from '@/lib/supabase/server'
import { IntegrationsList } from '@/components/integrations/integrations-list'
import { ConnectCRMPanel } from '@/components/integrations/connect-crm-panel'
import { SyncPanel } from '@/components/integrations/sync-panel'

/**
 * Integrations Page - Server Component
 * Управление подключениями к CRM системам
 */

export default async function IntegrationsPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Fetch user's integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM Integrations</h1>
        <p className="text-muted-foreground">
          Connect your CRM systems to import and sync data
        </p>
      </div>

      {/* Connect New CRM */}
      <ConnectCRMPanel />

      {/* Sync Panel */}
      <SyncPanel />

      {/* Active Integrations */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Connected CRMs</h2>
        <IntegrationsList integrations={integrations || []} />
      </div>

      {/* Integration Benefits */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 text-3xl">🔄</div>
          <h3 className="mb-2 font-semibold">Auto Sync</h3>
          <p className="text-sm text-gray-600">
            Automatically sync new and updated contacts every 10 minutes
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 text-3xl">🔒</div>
          <h3 className="mb-2 font-semibold">Secure OAuth</h3>
          <p className="text-sm text-gray-600">
            Industry-standard OAuth 2.0 authentication with encrypted tokens
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 text-3xl">📊</div>
          <h3 className="mb-2 font-semibold">Real-time Insights</h3>
          <p className="text-sm text-gray-600">
            See your CRM data in beautiful dashboards with live updates
          </p>
        </div>
      </div>
    </div>
  )
}

