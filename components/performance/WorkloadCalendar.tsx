'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { HeatmapData } from '@/lib/data/heatmap'
import { heatLevel, monthsInRange, monthMatrix, type MonthKey } from '@/lib/domain/heatmap'
import { Avatar } from '@/components/ui/Avatar'

const LEVEL_BG = ['bg-gray-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-700']
const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

function tooltip(date: string, count: number, titles?: string[]): string {
  if (count === 0) return `${date} · ว่าง`
  const head = `${date} · ${count} งาน`
  if (!titles?.length) return head
  const shown = titles.slice(0, 8).map((t) => `• ${t}`).join('\n')
  return `${head}\n${shown}${titles.length > 8 ? `\n…และอีก ${titles.length - 8}` : ''}`
}

/** ปฏิทินภาระงานรายบุคคล — Card ต่อคน, แยกเดือน/ปีชัดเจน, ยุบเดือนที่ผ่านมาได้ */
export function WorkloadCalendar({ data }: { data: HeatmapData }) {
  const months = useMemo(() => monthsInRange(data.startDate, data.endDate), [data.startDate, data.endDate])
  const currentKey = data.today.slice(0, 7) // 'YYYY-MM'

  // ค่าเริ่มต้น: ยุบเดือนที่ผ่านมาแล้ว (ก่อนเดือนปัจจุบัน) เพื่อโฟกัสปัจจุบัน–อนาคต
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(months.filter((m) => m.key < currentKey).map((m) => m.key)),
  )

  const visibleMonths = months.filter((m) => !collapsed.has(m.key))

  function toggleMonth(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  function setMany(keys: string[], collapse: boolean) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => (collapse ? next.add(k) : next.delete(k)))
      return next
    })
  }

  // จัดเดือนตามปีสำหรับแถบควบคุม
  const byYear = useMemo(() => {
    const map = new Map<number, MonthKey[]>()
    for (const m of months) {
      const arr = map.get(m.year) ?? []
      arr.push(m)
      map.set(m.year, arr)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [months])

  return (
    <div>
      {/* แถบควบคุมยุบ/ขยาย — แยกตามปี, กดชื่อเดือนเพื่อสลับ */}
      <div className="glass mb-5 space-y-2 rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-medium text-gray-500">แสดงเดือน:</span>
          <button onClick={() => setMany(months.map((m) => m.key), false)} className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-600 ring-1 ring-indigo-100 hover:bg-indigo-100">แสดงทั้งหมด</button>
          <button onClick={() => setMany(months.filter((m) => m.key < currentKey).map((m) => m.key), true)} className="rounded-md bg-gray-50 px-2 py-0.5 font-medium text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100">ซ่อนอดีต</button>
        </div>
        {byYear.map(([year, ms]) => {
          const keys = ms.map((m) => m.key)
          const allCollapsed = keys.every((k) => collapsed.has(k))
          return (
            <div key={year} className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMany(keys, !allCollapsed)}
                className="w-14 shrink-0 text-left text-xs font-bold text-gray-700 hover:text-indigo-600"
                title={allCollapsed ? 'ขยายทั้งปี' : 'ยุบทั้งปี'}
              >
                {year} {allCollapsed ? '▸' : '▾'}
              </button>
              {ms.map((m) => {
                const on = !collapsed.has(m.key)
                const isPast = m.key < currentKey
                const isCurrent = m.key === currentKey
                return (
                  <button
                    key={m.key}
                    onClick={() => toggleMonth(m.key)}
                    className={
                      'rounded-md px-2 py-0.5 text-[11px] font-medium transition ' +
                      (on
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200') +
                      (isCurrent ? ' ring-2 ring-rose-300' : '')
                    }
                    title={isPast ? 'เดือนที่ผ่านมา' : isCurrent ? 'เดือนปัจจุบัน' : 'เดือนถัดไป'}
                  >
                    {format(new Date(m.year, m.month0, 1), 'MMM')}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {data.users.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}

      {/* Card รายคน */}
      <div className="space-y-4">
        {data.users.map((uh) => (
          <div key={uh.user.id} className="animate-rise glass card-sheen rounded-2xl p-4 transition duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
            <div className="mb-3 flex items-center gap-2.5 border-b border-gray-50 pb-3">
              <Avatar user={uh.user} size={32} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-800">{uh.user.name}</div>
                <div className="text-[11px] text-gray-400">{uh.user.role}</div>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100" title="งานพร้อมกันสูงสุดในช่วงนี้">
                สูงสุด {uh.peak} งาน/วัน
              </span>
            </div>

            {visibleMonths.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-gray-400">เลือกเดือนที่ต้องการแสดงจากแถบด้านบน</p>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                {visibleMonths.map((m) => (
                  <MonthBlock key={m.key} month={m} uh={uh} globalMax={data.globalMax} today={data.today} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
        <span>ว่าง</span>
        {LEVEL_BG.map((bg, i) => <span key={i} className={`h-4 w-4 rounded ${bg}`} />)}
        <span>งานเยอะ</span>
        <span className="ml-3 inline-flex items-center gap-1"><span className="h-4 w-4 rounded ring-2 ring-rose-400" /> วันนี้</span>
      </div>
    </div>
  )
}

function MonthBlock({
  month,
  uh,
  globalMax,
  today,
}: {
  month: MonthKey
  uh: HeatmapData['users'][number]
  globalMax: number
  today: string
}) {
  const weeks = monthMatrix(month.year, month.month0)
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-gray-700">{format(new Date(month.year, month.month0, 1), 'MMMM yyyy')}</div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="flex h-4 w-7 items-center justify-center text-[9px] text-gray-400">{d}</span>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date, di) => {
              if (!date) return <span key={di} className="h-7 w-7" />
              const c = uh.counts[date] ?? 0
              const lvl = heatLevel(c, globalMax)
              const isToday = date === today
              return (
                <span
                  key={date}
                  title={tooltip(date, c, uh.titles[date])}
                  className={
                    `day-cell flex h-7 w-7 items-center justify-center rounded-md text-[10px] tabular-nums ${LEVEL_BG[lvl]} ` +
                    (lvl >= 3 ? 'text-white ' : 'text-gray-600 ') +
                    (isToday ? 'ring-2 ring-rose-400' : '')
                  }
                >
                  {Number(date.slice(8, 10))}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
