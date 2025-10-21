import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Zustand store for filter state
 * Persisted to localStorage for better UX
 */

interface DateRange {
  from: Date
  to: Date
}

interface FiltersState {
  // Filters
  search: string
  sources: string[]
  stages: string[]
  dateRange: DateRange | null

  // Actions
  setSearch: (search: string) => void
  setSources: (sources: string[]) => void
  setStages: (stages: string[]) => void
  setDateRange: (range: DateRange | null) => void
  clearFilters: () => void
}

const defaultDateRange: DateRange = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  to: new Date(),
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      // Initial state
      search: '',
      sources: [],
      stages: [],
      dateRange: defaultDateRange,

      // Actions
      setSearch: (search) => set({ search }),
      setSources: (sources) => set({ sources }),
      setStages: (stages) => set({ stages }),
      setDateRange: (dateRange) => set({ dateRange }),
      clearFilters: () =>
        set({
          search: '',
          sources: [],
          stages: [],
          dateRange: defaultDateRange,
        }),
    }),
    {
      name: 'topgrill-filters',
    }
  )
)

