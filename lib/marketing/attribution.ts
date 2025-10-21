/**
 * Marketing Attribution Logic
 * Determines which channel gets credit for conversion
 */

export interface TouchPoint {
  channel: string
  source: string
  medium: string
  campaign?: string
  timestamp: Date
  eventType: string
}

export type AttributionModel =
  | 'first-touch'
  | 'last-touch'
  | 'linear'
  | 'time-decay'
  | 'position-based'

/**
 * Calculate attribution based on model
 */
export function calculateAttribution(
  touchPoints: TouchPoint[],
  model: AttributionModel = 'last-touch'
): Record<string, number> {
  if (touchPoints.length === 0) return {}

  const sorted = [...touchPoints].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  switch (model) {
    case 'first-touch':
      return { [sorted[0].channel]: 1.0 }

    case 'last-touch':
      return { [sorted[sorted.length - 1].channel]: 1.0 }

    case 'linear':
      return linearAttribution(sorted)

    case 'time-decay':
      return timeDecayAttribution(sorted)

    case 'position-based':
      return positionBasedAttribution(sorted)

    default:
      return { [sorted[sorted.length - 1].channel]: 1.0 }
  }
}

/**
 * Linear attribution: Equal credit to all touches
 */
function linearAttribution(touchPoints: TouchPoint[]): Record<string, number> {
  const credit = 1.0 / touchPoints.length
  return touchPoints.reduce(
    (acc, tp) => {
      acc[tp.channel] = (acc[tp.channel] || 0) + credit
      return acc
    },
    {} as Record<string, number>
  )
}

/**
 * Time decay: More recent touches get more credit
 * Credit decays exponentially with 7-day half-life
 */
function timeDecayAttribution(
  touchPoints: TouchPoint[]
): Record<string, number> {
  const now = Date.now()
  const halfLife = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

  const weights = touchPoints.map((tp) => {
    const age = now - tp.timestamp.getTime()
    return Math.pow(0.5, age / halfLife)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  return touchPoints.reduce(
    (acc, tp, i) => {
      const credit = weights[i] / totalWeight
      acc[tp.channel] = (acc[tp.channel] || 0) + credit
      return acc
    },
    {} as Record<string, number>
  )
}

/**
 * Position-based (U-shaped): 40% first, 40% last, 20% middle
 */
function positionBasedAttribution(
  touchPoints: TouchPoint[]
): Record<string, number> {
  if (touchPoints.length === 1) {
    return { [touchPoints[0].channel]: 1.0 }
  }

  if (touchPoints.length === 2) {
    return {
      [touchPoints[0].channel]: 0.5,
      [touchPoints[1].channel]: 0.5,
    }
  }

  const result: Record<string, number> = {}
  const middleCredit = 0.2 / (touchPoints.length - 2)

  touchPoints.forEach((tp, i) => {
    let credit: number
    if (i === 0) credit = 0.4
    else if (i === touchPoints.length - 1) credit = 0.4
    else credit = middleCredit

    result[tp.channel] = (result[tp.channel] || 0) + credit
  })

  return result
}

/**
 * Store touch point in database
 */
export async function recordTouchPoint(
  contactId: string,
  touchPoint: Omit<TouchPoint, 'timestamp'>
) {
  // Implementation would store in database
  console.log('Record touch point:', { contactId, touchPoint })

  // Example: Store in events table
  // await supabase.from('events').insert({
  //   contact_id: contactId,
  //   event_name: 'touch_point',
  //   event_type: 'attribution',
  //   source: touchPoint.source,
  //   properties: touchPoint,
  // })
}

