'use client'

import { CalendarIcon } from 'lucide-react'
import { useFiltersStore } from '@/lib/stores/filters-store'

/**
 * Date range picker - Client Component
 * Integrates with Zustand filters store
 */
export function DateRangePicker() {
  const { dateRange } = useFiltersStore()

  return (
    <button className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50">
      <CalendarIcon className="h-4 w-4" />
      {dateRange ? (
        <span>
          {dateRange.from.toLocaleDateString()} -{' '}
          {dateRange.to.toLocaleDateString()}
        </span>
      ) : (
        <span>Select date range</span>
      )}
    </button>
  )
}

