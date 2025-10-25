import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MetricsGrid } from '@/components/analytics/metrics-grid'
import { ChartCard } from '@/components/analytics/chart-card'
import { RealtimeIndicator } from '@/components/shared/realtime-indicator'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { formatCurrency, formatNumber } from '@/lib/utils/dates'

// Materialized view interfaces
interface RevenueByMonth {
  month: string
  stage: string
  deals_closed: number
  revenue: number
  avg_deal_size: number
}

interface DealsPipeline {
  stage: string
  date: string
  deal_count: number
  total_value: number
  avg_deal_size: number
  avg_probability: number
  weighted_value: number
}

interface ConversionFunnel {
  date: string
  leads: number
  mql: number
  sql: number
  opportunities: number
  customers: number
}

/**
 * Analytics Dashboard - Server Component
 * Fetches aggregated metrics on the server for optimal performance
 */

interface PageProps {
  searchParams: Promise<{
    from?: string
    to?: string
  }>
}

async function getAnalyticsData(_from?: string, _to?: string) {
  const supabase = await createServerSupabaseClient()

  // Fetch key metrics from materialized views
  const [
    { data: pipelineData },
    { data: conversionData },
    { data: sourceData },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('mv_deals_pipeline').select('*').order('date', { ascending: false }).limit(30),
    supabase.from('mv_conversion_funnel').select('*').order('date', { ascending: false }).limit(30),
    supabase.from('mv_top_sources').select('*').order('revenue', { ascending: false }).limit(10),
    supabase.from('mv_revenue_by_month').select('*').eq('stage', 'closed-won').order('month', { ascending: false }).limit(12),
  ])

  // Calculate summary metrics
  const totalRevenue = (revenueData as RevenueByMonth[])?.reduce((sum, row) => sum + (row.revenue || 0), 0) || 0
  const totalDeals = (pipelineData as DealsPipeline[])?.reduce((sum, row) => sum + (row.deal_count || 0), 0) || 0
  const avgDealSize = totalDeals > 0 ? totalRevenue / totalDeals : 0

  // Conversion rates
  const latestFunnel = (conversionData as ConversionFunnel[])?.[0]
  const conversionRate = latestFunnel
    ? latestFunnel.leads > 0
      ? ((latestFunnel.customers / latestFunnel.leads) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  return {
    metrics: {
      totalRevenue,
      totalDeals,
      avgDealSize,
      conversionRate,
    },
    charts: {
      pipeline: pipelineData || [],
      conversion: conversionData || [],
      sources: sourceData || [],
      revenue: revenueData || [],
    },
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { from, to } = params

  // Server-side data fetching (from/to can be used for date filtering in future)
  const data = await getAnalyticsData(from, to)

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Real-time insights into your CRM performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeIndicator />
          <DateRangePicker />
        </div>
      </div>

      {/* Key Metrics */}
      <Suspense fallback={<MetricsGridSkeleton />}>
        <MetricsGrid
          metrics={[
            {
              title: 'Total Revenue',
              value: formatCurrency(data.metrics.totalRevenue),
              change: '+12.5%',
              trend: 'up' as const,
            },
            {
              title: 'Total Deals',
              value: formatNumber(data.metrics.totalDeals),
              change: '+8.2%',
              trend: 'up' as const,
            },
            {
              title: 'Avg Deal Size',
              value: formatCurrency(data.metrics.avgDealSize),
              change: '+4.1%',
              trend: 'up' as const,
            },
            {
              title: 'Conversion Rate',
              value: `${data.metrics.conversionRate}%`,
              change: '-0.3%',
              trend: 'down' as const,
            },
          ]}
        />
      </Suspense>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard
            title="Deals Pipeline"
            description="Value by stage over time"
            data={data.charts.pipeline}
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard
            title="Conversion Funnel"
            description="Lead to customer journey"
            data={data.charts.conversion}
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard
            title="Top Sources"
            description="Revenue by acquisition channel"
            data={data.charts.sources}
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard
            title="Monthly Revenue"
            description="Closed-won deals by month"
            data={data.charts.revenue}
          />
        </Suspense>
      </div>
    </div>
  )
}

function MetricsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
}

