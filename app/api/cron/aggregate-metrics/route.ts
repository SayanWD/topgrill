import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * CRON Job: Aggregate Metrics
 * Runs every 6 hours (configured in vercel.json)
 * Refreshes materialized views for fast dashboard queries
 * 
 * Secured by: CRON_SECRET environment variable
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Refresh all materialized views
    const { error } = await supabase.rpc('refresh_all_mv')

    if (error) throw error

    // Calculate and store daily metrics
    const today = new Date().toISOString().split('T')[0]

    // Example: Calculate daily lead count by source
    const { data: leadsBySource } = await supabase
      .from('contacts')
      .select('source')
      .gte('created_at', today)

    // Group by source
    const sourceMetrics: Record<string, number> = {}
    if (leadsBySource) {
      for (const contact of leadsBySource) {
        const source = (contact as { source: string | null }).source || 'unknown'
        sourceMetrics[source] = (sourceMetrics[source] || 0) + 1
      }
    }

    // Store in metrics_daily
    if (sourceMetrics) {
      for (const [source, count] of Object.entries(sourceMetrics)) {
        const metric = {
          date: today,
          metric_name: 'leads',
          metric_value: count,
          dimensions: { source },
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('metrics_daily')
          .insert([metric])
      }
    }

    // Calculate revenue metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: closedDeals } = await (supabase as any)
      .from('deals')
      .select('amount, stage')
      .eq('stage', 'closed-won')
      .gte('close_date', today)

    const totalRevenue = closedDeals?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, deal: any) => sum + Number(deal.amount || 0),
      0
    ) || 0

    if (totalRevenue !== undefined) {
      const revenueMetric = {
        date: today,
        metric_name: 'revenue',
        metric_value: totalRevenue,
        dimensions: { stage: 'closed-won' },
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('metrics_daily').insert([revenueMetric])
    }

    return NextResponse.json({
      message: 'Metrics aggregated successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Aggregation error:', err)
    return NextResponse.json(
      { error: 'Aggregation failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

