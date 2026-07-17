'use client'

import { useEffect, useState } from 'react'

/** นาฬิกาสด Asia/Bangkok — ให้ hero รู้สึกเป็น ops console (เลข mono กระพริบ colon) */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!now) return <span className="font-mono text-[11px] text-slate-400">--:--:--</span>

  const parts = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/[0.04] px-2.5 py-1 ring-1 ring-slate-900/10">
      <span className="live-dot" aria-hidden />
      <span className="font-mono text-[11px] font-medium tabular-nums text-slate-600">{parts}</span>
      <span className="text-[10px] text-slate-400">BKK</span>
    </span>
  )
}
