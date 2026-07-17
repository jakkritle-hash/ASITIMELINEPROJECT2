'use client'

import { Reveal } from '@/components/ui/Motion'
import { LiveClock } from '@/components/dashboard/LiveClock'

/**
 * ส่วนหัวหน้าแบบเดียวกันทั้งแอป — ชื่อ shimmer + ป้าย emoji ไล่เฉด + นาฬิกาสด (เลือกได้)
 * ช่องขวา (children) ใส่ปุ่ม action ของหน้านั้นๆ
 */
export function PageHero({
  title,
  subtitle,
  badge,
  gradient = 'from-indigo-500 to-blue-600',
  shadow = 'shadow-indigo-500/25',
  clock = false,
  children,
}: {
  title: string
  subtitle: React.ReactNode
  badge: string
  gradient?: string
  shadow?: string
  clock?: boolean
  children?: React.ReactNode
}) {
  return (
    <Reveal>
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`logo-glow flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-xl text-white ring-1 ring-inset ring-white/25 ${gradient} ${shadow}`}
            aria-hidden
          >
            {badge}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-shimmer text-xl font-bold sm:text-2xl">{title}</h1>
              {clock && <LiveClock />}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </header>
    </Reveal>
  )
}
