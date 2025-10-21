'use client'

import { LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

interface UserMenuProps {
  user: { email?: string }
  profile: { full_name?: string; role?: string } | null
}

/**
 * User menu - Client Component
 * Shows user info and logout
 */
export function UserMenu({ user, profile }: UserMenuProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right text-sm">
        <p className="font-medium">
          {profile?.full_name || user.email?.split('@')[0]}
        </p>
        <p className="text-xs text-gray-500">{profile?.role || 'viewer'}</p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
        title="Logout"
      >
        <LogOutIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

