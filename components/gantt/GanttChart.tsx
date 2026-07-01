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
  const [expanded, setExpanded] = useState<Set<string>>(new Set(projects[0] ? [projects[0].id] : []))

  const range: DateRange | null = timelineRange([
    ...projects.map((p) => ({ startDate: p.startDate, dueDate: p.dueDate })),
    ...projects.flatMap((p) => p.tasks.map((t) => ({ startDate: t.startDate, dueDate: t.dueDate }))),
  ])
  if (!range) return <p className="p-6 text-sm text-gray-500">ยังไม่มีโปรเจกต์</p>

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
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <span className="text-xs text-gray-500">Timeline รวมทุกโปรเจกต์</span>
        <ZoomControl zoom={zoom} onChange={setZoom} />
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: LABEL_W + timelineW }}>
          {/* Header layers */}
          {layers.map((layer) => (
            <div key={layer} className="flex border-b border-gray-100">
              <div className="shrink-0 bg-white" style={{ width: LABEL_W }} />
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
          {projects.map((p) => {
            const pm = barMetrics(p.startDate, p.dueDate, range)
            const pMeta = STATUS_META[p.status]
            const isOpen = expanded.has(p.id)
            return (
              <div key={p.id}>
                {/* Project row */}
                <div className="flex items-center border-b border-gray-50">
                  <div className="flex shrink-0 items-center gap-2 bg-white px-3 py-2" style={{ width: LABEL_W }}>
                    <button
                      onClick={() => toggle(p.id)}
                      className="flex h-4 w-4 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      {isOpen ? '−' : '+'}
                    </button>
                    <Link href={`/projects/${p.id}`} className="truncate text-sm font-semibold text-gray-800 hover:text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                    <span className="ml-auto">
                      <AvatarGroup users={p.members} size={18} />
                    </span>
                  </div>
                  <div className="relative" style={{ width: timelineW, height: 34 }}>
                    {todayLeft !== null && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-400/60" style={{ left: `${todayLeft}%` }} />
                    )}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-md"
                      style={{
                        left: `${pm.leftPct}%`,
                        width: `${pm.widthPct}%`,
                        height: 18,
                        backgroundColor: pMeta.color + '33',
                        border: `1px solid ${pMeta.color}`,
                      }}
                    />
                  </div>
                </div>

                {/* Task rows */}
                {isOpen &&
                  p.tasks.map((t) => {
                    const tm = barMetrics(t.startDate, t.dueDate, range)
                    const meta = STATUS_META[t.slaStatus]
                    return (
                      <div key={t.id} className="flex items-center border-b border-gray-50">
                        <div className="flex shrink-0 items-center gap-2 bg-white py-1.5 pr-3" style={{ width: LABEL_W, paddingLeft: 38 }}>
                          <Avatar user={t.assignee} size={16} />
                          <span className="truncate text-xs text-gray-600">{t.title}</span>
                        </div>
                        <div className="relative" style={{ width: timelineW, height: 26 }}>
                          {todayLeft !== null && (
                            <div className="absolute top-0 bottom-0 w-px bg-red-400/60" style={{ left: `${todayLeft}%` }} />
                          )}
                          <div
                            className="absolute top-1/2 flex -translate-y-1/2 items-center justify-end rounded pr-1 text-[9px] text-white"
                            style={{ left: `${tm.leftPct}%`, width: `${tm.widthPct}%`, height: 15, backgroundColor: meta.color }}
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

      <div className="flex flex-wrap gap-4 border-t border-gray-100 p-3 text-[10px] text-gray-500">
        <span style={{ color: STATUS_META['on-track'].color }}>✓ On-track</span>
        <span style={{ color: STATUS_META['at-risk'].fg }}>⚠ At-risk</span>
        <span style={{ color: STATUS_META.overdue.color }}>✕ Overdue</span>
        <span style={{ color: STATUS_META.done.fg }}>✔ Done</span>
        <span className="text-red-400">▏เส้นแดง = วันนี้</span>
      </div>
    </div>
  )
}
