import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Server-side Supabase client for App Router
 * Automatically handles cookie management for auth
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookie setting might fail in Server Components
            // This is expected and handled by middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Same as above
          }
        },
      },
    }
  )
}

/**
 * Server-side client with service role key
 * ONLY use in secure server contexts (API routes, Server Actions)
 * Bypasses RLS - use with caution!
 */
export function createServiceRoleClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      } as any,
    }
  )
}

