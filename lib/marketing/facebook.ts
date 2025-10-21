/**
 * Facebook Conversions API - Server-side tracking
 * Use this for tracking conversions that need attribution
 * 
 * Benefits over client-side:
 * - Ad blockers can't block it
 * - More reliable attribution
 * - Better iOS 14+ tracking
 */

interface ConversionEvent {
  eventName: string
  eventTime: number
  userData: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    clientIpAddress?: string
    clientUserAgent?: string
    fbp?: string // Facebook browser pixel
    fbc?: string // Facebook click ID
  }
  customData?: Record<string, unknown>
}

export async function trackServerSideConversion(event: ConversionEvent) {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID
  const accessToken = process.env.FB_CONVERSION_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    console.warn('FB Conversions API not configured')
    return
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            {
              event_name: event.eventName,
              event_time: event.eventTime,
              user_data: {
                em: event.userData.email
                  ? hashSHA256(event.userData.email.toLowerCase())
                  : undefined,
                ph: event.userData.phone
                  ? hashSHA256(event.userData.phone.replace(/\D/g, ''))
                  : undefined,
                fn: event.userData.firstName
                  ? hashSHA256(event.userData.firstName.toLowerCase())
                  : undefined,
                ln: event.userData.lastName
                  ? hashSHA256(event.userData.lastName.toLowerCase())
                  : undefined,
                client_ip_address: event.userData.clientIpAddress,
                client_user_agent: event.userData.clientUserAgent,
                fbp: event.userData.fbp,
                fbc: event.userData.fbc,
              },
              custom_data: event.customData,
            },
          ],
          access_token: accessToken,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`FB Conversions API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to track FB conversion:', error)
    throw error
  }
}

/**
 * Hash sensitive data (required by FB Conversions API)
 */
async function hashSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Example: Track purchase conversion
 */
export async function trackPurchase({
  email,
  amount,
  currency = 'USD',
  orderId,
}: {
  email: string
  amount: number
  currency?: string
  orderId: string
}) {
  return trackServerSideConversion({
    eventName: 'Purchase',
    eventTime: Math.floor(Date.now() / 1000),
    userData: {
      email,
    },
    customData: {
      currency,
      value: amount,
      order_id: orderId,
    },
  })
}

/**
 * Example: Track lead generation
 */
export async function trackLead({
  email,
  firstName,
  lastName,
}: {
  email: string
  firstName?: string
  lastName?: string
}) {
  return trackServerSideConversion({
    eventName: 'Lead',
    eventTime: Math.floor(Date.now() / 1000),
    userData: {
      email,
      firstName,
      lastName,
    },
  })
}

