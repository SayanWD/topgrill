/**
 * Google Ads Conversion Tracking
 * Server-side and client-side tracking utilities
 */

/**
 * Client-side: Track conversion via gtag
 * Use this in client components after user action
 */
export function trackGoogleAdsConversion(
  conversionLabel: string,
  value?: number,
  currency = 'USD'
) {
  if (typeof window === 'undefined') return

  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

  if (!adsId) {
    console.warn('Google Ads ID not configured')
    return
  }

  // @ts-expect-error - gtag is injected by GTM
  if (window.gtag) {
    // @ts-expect-error - gtag types
    window.gtag('event', 'conversion', {
      send_to: `${adsId}/${conversionLabel}`,
      value,
      currency,
    })
  }
}

/**
 * Server-side: Track conversion via Google Ads API
 * More reliable for important conversions
 */
export async function trackServerSideGoogleAdsConversion({
  conversionLabel,
  gclid,
  conversionValue,
  currency = 'USD',
}: {
  conversionLabel: string
  gclid?: string
  conversionValue?: number
  currency?: string
}) {
  // Note: Google Ads API requires OAuth and is complex
  // For production, use official Google Ads API client
  // This is a simplified example

  console.log('Track Google Ads conversion:', {
    conversionLabel,
    gclid,
    conversionValue,
    currency,
  })

  // Implementation would call Google Ads API here
  // See: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
}

/**
 * Enhanced conversions: Send hashed user data
 * Improves attribution accuracy
 */
export function sendEnhancedConversion({
  email,
  phone,
  firstName,
  lastName,
  address,
}: {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  address?: {
    street?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
  }
}) {
  if (typeof window === 'undefined') return

  // @ts-expect-error - gtag types
  if (window.gtag) {
    // @ts-expect-error - gtag types
    window.gtag('set', 'user_data', {
      email,
      phone_number: phone,
      first_name: firstName,
      last_name: lastName,
      address: {
        street: address?.street,
        city: address?.city,
        region: address?.region,
        postal_code: address?.postalCode,
        country: address?.country,
      },
    })
  }
}

