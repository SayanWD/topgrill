'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/analytics', label: 'Analytics' },
  { href: '/integrations', label: '🔗 Integrations' },
  { href: '/import', label: '📥 Import' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/deals', label: 'Deals' },
]

/**
 * Dashboard navigation - Client Component
 * Highlights active route
 */
export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

