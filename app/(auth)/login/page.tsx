import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/login-form'

/**
 * Login page - Server Component
 * Redirects if already authenticated
 */
export default async function LoginPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/analytics')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            TopGrill Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your CRM dashboard
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

