import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface Metric {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
}

interface MetricsGridProps {
  metrics: Metric[]
}

/**
 * Metrics Grid - Server Component
 * Displays key performance indicators
 */
export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="rounded-lg border bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-medium text-gray-600">{metric.title}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold">{metric.value}</p>
            <span
              className={`inline-flex items-center text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {metric.trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              {metric.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

