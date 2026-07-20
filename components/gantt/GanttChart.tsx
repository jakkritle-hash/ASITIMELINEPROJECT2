'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ProjectKind } from '@/lib/domain/types'
import { differenceInCalendarDays } from 'date-fns'
import type { EnrichedProject } from '@/lib/data/dashboard'
import { barMetrics, timelineRange, type DateRange } from '@/lib/domain/ganttGeometry'
import { segmentsForLayer } from '@/lib/domain/ganttHeader'
import { layersForZoom, type ZoomLevel } from '@/lib/domain/timeLayers'
import { STATUS_META } from '@/components/ui/StatusBadge'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { reorderProjectsAction } from '@/app/actions/projects'
import { reorderTasksAction } from '@/app/actions/tasks'
import { ZoomControl } from './ZoomControl'

const LABEL_W = 420
const PX_PER_DAY: Record<ZoomLevel, number> = { year: 2.2, quarter: 4, month: 9, week: 22, day: 44 }

/** ป้ายประเภทโปรเจกต์ — แสดงทุกแถวเสมอ (รวม Main) ให้แยกประเภทออกทันที */
const KIND_TAG: Record<ProjectKind, { label: string; cls: string; hint: string }> = {
  main: { label: 'Main', cls: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100', hint: 'โปรเจกต์หลัก — นับคะแนนหลัก' },
  expand: { label: 'Expand', cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', hint: 'งานต่อยอด — คิดคะแนนแยก' },
  maintenance: { label: 'Maint', cls: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100', hint: 'งานดูแลรักษา — คิดคะแนนแยก' },
  revise: { label: 'Revise', cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100', hint: 'งานแก้ไข/ปรับปรุง — คิดคะแนนแยก' },
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function GanttChart({ projects }: { projects: EnrichedProject[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>('month')
  // สถานะ 3 ทาง: all = เห็นทุกโปรเจกต์, active = เฉพาะที่ยังค้าง, approved = เฉพาะที่ Approve แล้ว
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'approved'>('active')
  const [kindFilter, setKindFilter] = useState<'all' | ProjectKind>('all')
  // ลำดับที่จัดเอง (ลากขึ้น-ลง) — เริ่มจากลำดับที่ server ส่งมา, self-heal โปรเจกต์ใหม่/ถูกลบ
  const [order, setOrder] = useState<string[]>(() => projects.map((p) => p.id))
  const [dragId, setDragId] = useState<string | null>(null)
  const posById = new Map(order.map((id, i) => [id, i]))
  const orderedProjects = [...projects].sort((a, b) => (posById.get(a.id) ?? 1e9) - (posById.get(b.id) ?? 1e9))

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const archivedCount = projects.filter((p) => p.archived).length
  const activeCount = projects.length - archivedCount
  const visible = orderedProjects.filter(
    (p) =>
      (statusFilter === 'all' || (statusFilter === 'approved' ? p.archived : !p.archived)) &&
      (kindFilter === 'all' || p.kind === kindFilter) &&
      // ค้นหา: ชื่อโปรเจกต์ หรือชื่องานภายใน
      (!q || p.name.toLowerCase().includes(q) || p.tasks.some((t) => t.title.toLowerCase().includes(q))),
  )
  // เริ่มต้นยุบทุกโปรเจกต์ — ให้ผู้ใช้กดกางเอง (ไม่เปิดแถวแรกให้อัตโนมัติ)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function reorderTo(targetId: string) {
    if (!dragId || dragId === targetId) return setDragId(null)
    const ids = orderedProjects.map((p) => p.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return setDragId(null)
    ids.splice(to, 0, ids.splice(from, 1)[0])
    setOrder(ids)
    setDragId(null)
    void reorderProjectsAction(ids) // persist (revalidate '/' ให้คนอื่นเห็นตอนโหลดถัดไป)
  }

  // ── ลากสลับลำดับ "งาน" ภายในโปรเจกต์เดียวกัน ──
  const [taskOrders, setTaskOrders] = useState<Record<string, string[]>>({})
  const [dragTask, setDragTask] = useState<{ pid: string; id: string } | null>(null)

  function tasksOf(p: EnrichedProject) {
    const ids = taskOrders[p.id]
    if (!ids) return p.tasks
    const pos = new Map(ids.map((id, i) => [id, i]))
    return [...p.tasks].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9))
  }

  function reorderTaskTo(p: EnrichedProject, targetId: string) {
    const drag = dragTask
    setDragTask(null)
    if (!drag || drag.pid !== p.id || drag.id === targetId) return
    const ids = tasksOf(p).map((t) => t.id)
    const from = ids.indexOf(drag.id)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])
    setTaskOrders((prev) => ({ ...prev, [p.id]: ids }))
    void reorderTasksAction(p.id, ids) // persist
  }

  const range: DateRange | null = timelineRange([
    ...visible.map((p) => ({ startDate: p.startDate, dueDate: p.dueDate })),
    ...visible.flatMap((p) => p.tasks.map((t) => ({ startDate: t.startDate, dueDate: t.dueDate }))),
  ])
  // Toolbar (หัวตาราง + ปุ่มกรอง) — ต้องแสดงเสมอ แม้ผลกรองจะว่าง เพื่อให้กดกลับได้
  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white p-3">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
          Project Timeline
        </span>
        {/* ตัวกรองสถานะ 3 ทาง: ทั้งหมด / ค้างอยู่ / Approved — ใช้ร่วมกับตัวกรองประเภทได้ */}
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5 ring-1 ring-gray-200">
          {(
            [
              { key: 'all', label: `ทั้งหมด (${projects.length})`, on: 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200' },
              { key: 'active', label: `🕒 ค้างอยู่ (${activeCount})`, on: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm' },
              { key: 'approved', label: `✅ Approved (${archivedCount})`, on: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm' },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition ' +
                (statusFilter === s.key ? s.on : 'text-gray-500 hover:text-gray-700')
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* กรองตามประเภทโปรเจกต์ */}
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5 ring-1 ring-gray-200">
          {(['all', 'main', 'expand', 'maintenance', 'revise'] as const).map((k) => {
            const active = kindFilter === k
            const label = k === 'all' ? 'All' : k === 'main' ? 'Main' : k === 'expand' ? 'Expand' : k === 'maintenance' ? 'Maint' : 'Revise'
            return (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={
                  'rounded-md px-2 py-0.5 text-[11px] font-medium transition ' +
                  (active ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700')
                }
              >
                {label}
              </button>
            )
          })}
        </div>
        {/* ค้นหาโปรเจกต์/งาน */}
        <div className="relative">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาโปรเจกต์/งาน…"
            className="w-40 rounded-lg border border-gray-200 bg-white py-1 pl-7 pr-6 text-[11px] outline-none transition focus:w-52 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-300 hover:text-gray-500"
              title="ล้างคำค้น"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <ZoomControl zoom={zoom} onChange={setZoom} />
    </div>
  )

  if (!range) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {toolbar}
        <p className="p-6 text-sm text-gray-500">ยังไม่มีโปรเจกต์ที่แสดงสำหรับตัวกรองนี้</p>
      </div>
    )
  }

  const totalDays = Math.max(1, differenceInCalendarDays(new Date(range.end), new Date(range.start)))
  const timelineW = Math.max(600, Math.round(totalDays * PX_PER_DAY[zoom]))
  const layers = layersForZoom(zoom)
  const today = todayIso()

  // แถบแรเงาเสาร์-อาทิตย์ (ข้ามเมื่อ zoom ละเอียดต่ำจนมองไม่ออก)
  const weekendBands: { leftPct: number; widthPct: number }[] = []
  if (PX_PER_DAY[zoom] >= 4) {
    const cur = new Date(range.start + 'T00:00:00')
    const end = new Date(range.end + 'T00:00:00')
    while (cur <= end) {
      if (cur.getDay() === 6 || cur.getDay() === 0) {
        const iso = cur.toISOString().slice(0, 10)
        weekendBands.push(barMetrics(iso, iso, range))
      }
      cur.setDate(cur.getDate() + 1)
    }
  }
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
      {toolbar}

      {/* กรอบเลื่อนของ Gantt เอง (แนวตั้ง+แนวนอน) เพื่อ freeze หัวแถวและคอลัมน์ชื่อ */}
      <div className="max-h-[70vh] overflow-auto">
        <div style={{ width: LABEL_W + timelineW }}>
          {/* Header layers — freeze ไว้ด้านบน (sticky top) เลื่อนลงก็ยังเห็นเดือน/สัปดาห์ */}
          <div className="sticky top-0 z-30 bg-white shadow-[0_2px_4px_-2px_rgba(15,23,42,0.18)]">
            {layers.map((layer) => (
              <div key={layer} className="flex border-b border-gray-100">
                <div className="sticky left-0 z-40 shrink-0 border-r border-gray-100 bg-white" style={{ width: LABEL_W }} />
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
          </div>

          {/* Rows — ครอบด้วย relative เพื่อวางแถบแรเงาเสาร์-อาทิตย์ไว้ด้านหลังทุกแถว */}
          <div className="relative">
            {weekendBands.length > 0 && (
              <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: LABEL_W, width: timelineW }}>
                {weekendBands.map((b, i) => (
                  <div key={i} className="absolute inset-y-0 bg-slate-400/[0.08]" style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }} />
                ))}
              </div>
            )}
          {visible.map((p) => {
            const pm = barMetrics(p.startDate, p.dueDate, range)
            const pMeta = STATUS_META[p.status]
            const isOpen = expanded.has(p.id)
            return (
              <div key={p.id}>
                {/* Project row — วางทับได้เพื่อจัดลำดับ (drop target) */}
                <div
                  onDragOver={(e) => { if (dragId) e.preventDefault() }}
                  onDrop={() => reorderTo(p.id)}
                  className={
                    'group flex items-center border-b border-gray-50 transition-colors hover:bg-indigo-50/20 ' +
                    (dragId === p.id ? 'opacity-40 ' : '') +
                    (dragId && dragId !== p.id ? 'hover:bg-indigo-100/60' : '')
                  }
                >
                  <div className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-gray-100 bg-white px-3 py-2 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.25)] transition-colors group-hover:bg-indigo-50/40" style={{ width: LABEL_W }}>
                    {/* ที่จับสำหรับลากจัดลำดับ */}
                    <span
                      draggable
                      onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => setDragId(null)}
                      title="ลากเพื่อจัดลำดับ"
                      className="shrink-0 cursor-grab select-none px-0.5 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                    >
                      ⠿
                    </span>
                    <button
                      onClick={() => toggle(p.id)}
                      className="flex h-4 w-4 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      {isOpen ? '−' : '+'}
                    </button>
                    <Link href={`/projects/${p.id}`} className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-800 [overflow-wrap:anywhere] hover:text-blue-600 hover:underline" title={p.name}>
                      {p.name}
                    </Link>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${KIND_TAG[p.kind].cls}`} title={KIND_TAG[p.kind].hint}>
                      {KIND_TAG[p.kind].label}
                    </span>
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
                  tasksOf(p).map((t) => {
                    const tm = barMetrics(t.startDate, t.dueDate, range)
                    const meta = STATUS_META[t.slaStatus]
                    return (
                      <div
                        key={t.id}
                        onDragOver={(e) => { if (dragTask?.pid === p.id) e.preventDefault() }}
                        onDrop={() => reorderTaskTo(p, t.id)}
                        className={
                          'group flex items-center border-b border-gray-50 transition-colors hover:bg-indigo-50/20 ' +
                          (dragTask?.id === t.id ? 'opacity-40 ' : '') +
                          (dragTask && dragTask.pid === p.id && dragTask.id !== t.id ? 'hover:bg-indigo-100/60' : '')
                        }
                      >
                        <div className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-gray-100 bg-white py-1.5 pr-3 shadow-[6px_0_12px_-10px_rgba(15,23,42,0.25)] transition-colors group-hover:bg-indigo-50/40" style={{ width: LABEL_W, paddingLeft: 22 }}>
                          {/* ที่จับลากสลับลำดับงาน (ภายในโปรเจกต์เดียวกัน) */}
                          <span
                            draggable
                            onDragStart={(e) => { setDragTask({ pid: p.id, id: t.id }); e.dataTransfer.effectAllowed = 'move' }}
                            onDragEnd={() => setDragTask(null)}
                            title="ลากเพื่อสลับลำดับงาน"
                            className="shrink-0 cursor-grab select-none px-0.5 text-gray-200 hover:text-gray-500 active:cursor-grabbing"
                          >
                            ⠿
                          </span>
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
                            title={`${t.title}\n${meta.label} · ${t.startDate} → ${t.dueDate}${t.assignee ? ` · ${t.assignee.name}` : ''}`}
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
