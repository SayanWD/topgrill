'use client'

import { useEffect } from 'react'
import { WifiIcon, WifiOffIcon } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRealtimeStore } from '@/lib/stores/realtime-store'

/**
 * Real-time connection indicator - Client Component
 * Shows connection status and subscribes to updates
 */
export function RealtimeIndicator() {
  const { isConnected, setConnected, addUpdate } = useRealtimeStore()

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Subscribe to contacts changes
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        (payload) => {
          addUpdate('contact', payload.eventType as 'insert' | 'update' | 'delete')
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    // Subscribe to deals changes
    const dealsChannel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        (payload) => {
          addUpdate('deal', payload.eventType as 'insert' | 'update' | 'delete')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(contactsChannel)
      supabase.removeChannel(dealsChannel)
    }
  }, [setConnected, addUpdate])

  return (
    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
      {isConnected ? (
        <>
          <WifiIcon className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-600">Live</span>
        </>
      ) : (
        <>
          <WifiOffIcon className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Offline</span>
        </>
      )}
    </div>
  )
}

