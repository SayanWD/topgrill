import { create } from 'zustand'

/**
 * Zustand store for real-time updates
 * Tracks connection status and recent changes
 */

interface RealtimeState {
  isConnected: boolean
  lastUpdate: Date | null
  updates: Array<{
    id: string
    type: 'contact' | 'deal' | 'event'
    action: 'insert' | 'update' | 'delete'
    timestamp: Date
  }>

  setConnected: (connected: boolean) => void
  addUpdate: (
    type: 'contact' | 'deal' | 'event',
    action: 'insert' | 'update' | 'delete'
  ) => void
  clearUpdates: () => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  isConnected: false,
  lastUpdate: null,
  updates: [],

  setConnected: (connected) => set({ isConnected: connected }),

  addUpdate: (type, action) =>
    set((state) => ({
      lastUpdate: new Date(),
      updates: [
        {
          id: crypto.randomUUID(),
          type,
          action,
          timestamp: new Date(),
        },
        ...state.updates.slice(0, 99), // Keep last 100 updates
      ],
    })),

  clearUpdates: () => set({ updates: [] }),
}))

