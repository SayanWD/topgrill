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
    const sourceMetrics = leadsBySource?.reduce(
      (acc, contact) => {
        const source = contact.source || 'unknown'
        acc[source] = (acc[source] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Store in metrics_daily
    if (sourceMetrics) {
      const metricsToInsert = Object.entries(sourceMetrics).map(
        ([source, count]) => ({
          date: today,
          metric_name: 'leads',
          metric_value: count,
          dimensions: { source },
        })
      )

      await supabase
        .from('metrics_daily')
        .upsert(metricsToInsert, {
          onConflict: 'date,metric_name,dimensions',
        })
    }

    // Calculate revenue metrics
    const { data: closedDeals } = await supabase
      .from('deals')
      .select('amount, stage')
      .eq('stage', 'closed-won')
      .gte('close_date', today)

    const totalRevenue = closedDeals?.reduce(
      (sum, deal) => sum + Number(deal.amount),
      0
    )

    if (totalRevenue !== undefined) {
      await supabase.from('metrics_daily').upsert({
        date: today,
        metric_name: 'revenue',
        metric_value: totalRevenue,
        dimensions: { stage: 'closed-won' },
      })
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

