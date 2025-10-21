import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { UserMenu } from '@/components/dashboard/user-menu'

/**
 * Dashboard layout - Server Component
 * Protects routes and provides navigation
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">TopGrill</h1>
            <DashboardNav />
          </div>
          <UserMenu user={user} profile={profile} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}

