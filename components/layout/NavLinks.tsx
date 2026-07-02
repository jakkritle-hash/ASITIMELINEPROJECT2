'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/performance', label: 'Performance' },
  { href: '/admin/members', label: 'Team Member' },
  { href: '/admin/teams', label: 'Team' },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? 'text-indigo-700' : 'text-slate-500 hover:bg-indigo-50/70 hover:text-indigo-700'
            }`}
          >
            {l.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
