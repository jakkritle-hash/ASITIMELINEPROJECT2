'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { PAGES } from '@/lib/domain/pages'

/**
 * เมนู — แสดงเฉพาะหน้าที่ผู้ใช้มีสิทธิ์เข้าถึง (allowed = คีย์หน้าที่เข้าได้)
 * แคปซูล active เลื่อนไหลตามเมนูด้วย motion layoutId (spring)
 */
export function NavLinks({ allowed }: { allowed: string[] }) {
  const pathname = usePathname()
  const set = new Set(allowed)
  const links = PAGES.filter((p) => set.has(p.key))
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {links.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className={`relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? 'text-indigo-700' : 'text-slate-500 hover:text-indigo-700'
            }`}
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-indigo-50 to-blue-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-indigo-100"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            {!active && (
              <span className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 hover:opacity-100 bg-indigo-50/60" aria-hidden />
            )}
            <span className="relative">{l.label}</span>
            {active && (
              <motion.span
                layoutId="nav-active-underline"
                className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}
