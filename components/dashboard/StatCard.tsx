'use client'

import { Reveal, CountUp, Tilt } from '@/components/ui/Motion'

/**
 * การ์ดตัวเลข insight เจนใหม่ — glass + tilt 3D + เลขวิ่ง + sheen sweep
 * (แทน Stat เดิมใน app/page.tsx; รับข้อมูลเดิมครบทุก prop)
 */
export function StatCard({
  label,
  value,
  unit,
  gradient,
  shadow,
  icon,
  alert,
  bar,
  hint,
  delay = 0,
}: {
  label: string
  value: number
  unit: string
  gradient: string
  shadow: string
  icon: React.ReactNode
  alert?: boolean
  bar?: number
  hint?: string
  delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <Tilt className={`group relative rounded-2xl ${alert ? 'pulse-alert' : ''}`}>
        <div className="glass card-sheen relative flex items-center gap-3 overflow-hidden rounded-2xl p-3.5">
          {/* ไอคอนไล่เฉด + halo หมุนตอน hover */}
          <span
            className={`icon-halo relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-inset ring-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${gradient} ${shadow}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {icon}
            </svg>
          </span>

          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-xl font-bold tracking-tight ${alert ? 'text-red-600' : 'text-slate-900'}`}>
                <CountUp value={value} delay={delay + 0.15} />
              </span>
              <span className="text-[10px] text-slate-400">{unit}</span>
              {hint && (
                <span className="ml-auto animate-pulse rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-500 ring-1 ring-red-100">
                  {hint}
                </span>
              )}
            </div>
            <div className="truncate text-[11px] font-medium text-slate-500">{label}</div>
            {bar != null && (
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-900/8">
                <div
                  className="bar-stripes h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 transition-[width] duration-1000 ease-out"
                  style={{ width: `${bar}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </Tilt>
    </Reveal>
  )
}
