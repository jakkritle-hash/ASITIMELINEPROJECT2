'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PAGES } from '@/lib/domain/pages'

/** เมนู — แสดงเฉพาะหน้าที่ผู้ใช้มีสิทธิ์เข้าถึง (allowed = คีย์หน้าที่เข้าได้) */
export function NavLinks({ allowed }: { allowed: string[] }) {
  const pathname = usePathname()
  const set = new Set(allowed)
  const links = PAGES.filter((p) => set.has(p.key))
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {links.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            prefetch={false}
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
