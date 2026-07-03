'use client'

import { useState } from 'react'
import Link from 'next/link'
import { differenceInCalendarDays } from 'date-fns'
import type { EnrichedProject } from '@/lib/data/dashboard'
import { barMetrics, timelineRange, type DateRange } from '@/lib/domain/ganttGeometry'
import { segmentsForLayer } from '@/lib/domain/ganttHeader'
import { layersForZoom, type ZoomLevel } from '@/lib/domain/timeLayers'
import { STATUS_META } from '@/components/ui/StatusBadge'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { ZoomControl } from './ZoomControl'

const LABEL_W = 280
const PX_PER_DAY: Record<ZoomLevel, number> = { year: 2.2, quarter: 4, month: 9, week: 22, day: 44 }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function GanttChart({ projects }: { projects: EnrichedProject[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>('month')
  const [showArchived, setShowArchived] = useState(false)
  const archivedCount = projects.filter((p) => p.archived).length
  const visible = projects.filter((p) => showArchived || !p.archived)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(visible[0] ? [visible[0].id] : []))

  const range: DateRange | null = timelineRange([
    ...visible.map((p) => ({ startDate: p.startDate, dueDate: p.dueDate })),
    ...visible.flatMap((p) => p.tasks.map((t) => ({ startDate: t.startDate, dueDate: t.dueDate }))),
  ])
  if (!range) return <p className="p-6 text-sm text-gray-500">ยังไม่มีโปรเจกต์ที่แสดง</p>

  const totalDays = Math.max(1, differenceInCalendarDays(new Date(range.end), new Date(range.start)))
  const timelineW = Math.max(600, Math.round(totalDays * PX_PER_DAY[zoom]))
  const layers = layersForZoom(zoom)
  const today = todayIso()
  const todayInRange = today >= range.start && today <= range.end
  const todayLeft = todayInRange ? barMetrics(today, today, range).leftPct : null

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white p-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
            Project Timeline
          </span>
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={
                'rounded-md px-2 py-1 text-[11px] transition ' +
                (showArchived ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }
            >
              {showArchived ? 'Hide Approved' : `✅ Approved (${archivedCount})`}
            </button>
          )}
        </div>
        <ZoomControl zoom={zoom} onChange={setZoom} />
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: LABEL_W + timelineW }}>
          {/* Header layers */}
          {layers.map((layer) => (
            <div key={layer} className="flex border-b border-gray-100">
              <div className="sticky left-0 z-20 shrink-0 border-r border-gray-100 bg-white" style={{ width: LABEL_W }} />
              <div className="relative" style={{ width: timelineW, height: 22 }}>
                {segmentsForLayer(layer, range).map((seg, i) => {
                  const pxWidth = (seg.widthPct / 100) * timelineW
                  return (
                    <div
                      key={i}
                      className="absolute flex items-center justify-center overflow-hidden border-r border-gray-100 text-[10px] whitespace-nowrap text-gray-500"
                      style={{ left: `${seg.leftPct}%`, width: `${seg.widthPct}%`, height: '100%' }}
                    >
                      {pxWidth > 16 ? seg.label : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Rows */}
          {visible.map((p) => {
            const pm = barMetrics(p.startDate, p.dueDate, range)
            const pMeta = STATUS_META[p.status]
            const isOpen = expanded.has(p.id)
            return (
              <div key={p.id}>
                {/* Project row */}
                <div className="group flex items-center border-b border-gray-50 transition-colors hover:bg-indigo-50/20">
                  <div className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-gray-100 bg-white px-3 py-2 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.25)] transition-colors group-hover:bg-indigo-50/40" style={{ width: LABEL_W }}>
                    <button
                      onClick={() => toggle(p.id)}
                      className="flex h-4 w-4 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      {isOpen ? '−' : '+'}
                    </button>
                    <Link href={`/projects/${p.id}`} className="truncate text-sm font-semibold text-gray-800 hover:text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500" title="วันทำการรวมของโปรเจกต์">
                      {p.workingDays}d
                    </span>
                    {p.complete ? (
                      <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700" title="All tasks done">
                        ✅ Done
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1" title={`ความคืบหน้า ${p.progress}%`}>
                        <span className="h-1.5 w-10 overflow-hidden rounded-full bg-gray-200">
                          <span className="block h-full rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                        </span>
                        <span className="text-[10px] text-gray-500">{p.progress}%</span>
                      </span>
                    )}
                    {p.archived && <span className="shrink-0 text-[10px] text-green-500" title="Approved">✅</span>}
                    <span className="ml-auto">
                      <AvatarGroup users={p.members} size={18} />
                    </span>
                  </div>
                  <div className="relative" style={{ width: timelineW, height: 34 }}>
                    {todayLeft !== null && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-400/60" style={{ left: `${todayLeft}%` }} />
                    )}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-sm"
                      style={{
                        left: `${pm.leftPct}%`,
                        width: `${pm.widthPct}%`,
                        height: 18,
                        backgroundColor: pMeta.color + '22',
                        border: `1px solid ${pMeta.color}66`,
                      }}
                      title={`${p.progress}% · ${p.startDate} → ${p.dueDate}`}
                    >
                      {/* progress fill ในแท่ง */}
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${pMeta.color}cc, ${pMeta.color})` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task rows */}
                {isOpen &&
                  p.tasks.map((t) => {
                    const tm = barMetrics(t.startDate, t.dueDate, range)
                    const meta = STATUS_META[t.slaStatus]
                    return (
                      <div key={t.id} className="group flex items-center border-b border-gray-50 transition-colors hover:bg-indigo-50/20">
                        <div className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-gray-100 bg-white py-1.5 pr-3 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.25)] transition-colors group-hover:bg-indigo-50/40" style={{ width: LABEL_W, paddingLeft: 38 }}>
                          <Avatar user={t.assignee} size={16} />
                          <span className="truncate text-xs text-gray-600">{t.title}</span>
                          <span className="shrink-0 text-[10px] text-gray-400" title="วันทำการของงานนี้">· {t.workingDays}d</span>
                        </div>
                        <div className="relative" style={{ width: timelineW, height: 26 }}>
                          {todayLeft !== null && (
                            <div className="absolute top-0 bottom-0 w-px bg-red-400/60" style={{ left: `${todayLeft}%` }} />
                          )}
                          <div
                            className="absolute top-1/2 flex -translate-y-1/2 items-center justify-end rounded-full pr-1.5 text-[9px] text-white shadow-sm"
                            style={{ left: `${tm.leftPct}%`, width: `${tm.widthPct}%`, height: 15, background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})` }}
                            title={`${meta.label} · ครบ ${t.dueDate}`}
                          >
                            {meta.symbol}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-gray-50/40 p-3 text-[10px]">
        {(['on-track', 'at-risk', 'overdue', 'done'] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-gray-600 ring-1 ring-gray-100">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[k].color }} />
            {STATUS_META[k].symbol} {STATUS_META[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-gray-600 ring-1 ring-gray-100">
          <span className="h-3 w-0.5 rounded-full bg-red-400" /> เส้นแดง = วันนี้
        </span>
      </div>
    </div>
  )
}
