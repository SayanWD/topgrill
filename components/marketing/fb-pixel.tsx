'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Facebook Pixel - Client Component
 * Tracks page views and custom events
 * 
 * Note: Client-side only due to browser API requirements
 */

declare global {
  interface Window {
    fbq: (
      type: string,
      event: string,
      params?: Record<string, unknown>
    ) => void
  }
}

export function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

  useEffect(() => {
    if (!pixelId) return

    // Initialize FB Pixel via script tag (no library needed)
    if (window.fbq) {
      window.fbq('init', pixelId)
      window.fbq('track', 'PageView')
    }
  }, [pixelId])

  useEffect(() => {
    // Track route changes
    if (window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  if (!pixelId) return null

  return (
    <>
      <script
        id="fb-pixel"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

/**
 * Track custom conversion events
 */
export function trackFBEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (window.fbq) {
    window.fbq('track', eventName, params)
  }
}

