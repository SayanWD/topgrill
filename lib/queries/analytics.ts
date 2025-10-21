import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * TanStack Query hooks for analytics data
 * Provides optimized caching and real-time updates
 */

export interface MetricData {
  date: string
  value: number
  [key: string]: unknown
}

export function useAnalyticsMetrics(
  metricName: string,
  dateRange?: { from: Date; to: Date }
) {
  return useQuery({
    queryKey: ['analytics', metricName, dateRange],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      let query = supabase
        .from('metrics_daily')
        .select('*')
        .eq('metric_name', metricName)
        .order('date', { ascending: false })

      if (dateRange) {
        query = query
          .gte('date', dateRange.from.toISOString().split('T')[0])
          .lte('date', dateRange.to.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error
      return data as MetricData[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePipelineData() {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('mv_deals_pipeline')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      return data
    },
  })
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('mv_conversion_funnel')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      return data
    },
  })
}

export function useTopSources() {
  return useQuery({
    queryKey: ['top-sources'],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('mv_top_sources')
        .select('*')
        .order('revenue', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
  })
}

export function useExportData() {
  return useMutation({
    mutationFn: async ({
      type,
      format,
    }: {
      type: 'contacts' | 'deals' | 'events'
      format: 'csv' | 'xlsx'
    }) => {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, format }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_export.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}

