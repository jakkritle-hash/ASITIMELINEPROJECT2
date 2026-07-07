'use client'

import { useState } from 'react'
import type { MemberStats } from '@/lib/domain/performance'
import type { ProjectKind } from '@/lib/domain/types'
import { Avatar } from '@/components/ui/Avatar'
import { STATUS_META } from '@/components/ui/StatusBadge'

/** เหรียญตามอันดับ — แชมป์ 3 อันดับแรกได้ 🏆🥈🥉 ที่เหลือเป็นเลขอันดับ */
const MEDALS: Record<number, { icon: string; label: string; ring: string; badge: string; bar: string }> = {
  1: { icon: '🏆', label: 'Champion', ring: 'ring-2 ring-amber-400', badge: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white', bar: 'from-amber-400 via-yellow-400 to-amber-500' },
  2: { icon: '🥈', label: 'Runner-up', ring: 'ring-1 ring-slate-300', badge: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white', bar: 'from-slate-300 via-slate-200 to-slate-400' },
  3: { icon: '🥉', label: '3rd', ring: 'ring-1 ring-orange-300', badge: 'bg-gradient-to-br from-orange-300 to-amber-600 text-white', bar: 'from-orange-300 via-amber-400 to-orange-500' },
}

const TABS: { key: ProjectKind; label: string; note: string; accent: string }[] = [
  { key: 'main', label: 'Main', note: 'โปรเจกต์หลัก', accent: 'from-indigo-500 to-blue-600' },
  { key: 'expand', label: 'Expand', note: 'งานต่อยอด', accent: 'from-slate-500 to-slate-600' },
  { key: 'maintenance', label: 'Maintenance', note: 'งานดูแลรักษา', accent: 'from-teal-500 to-emerald-600' },
]

export function PerformanceBoard({
  main,
  expand,
  maintenance,
  projectNames,
}: {
  main: MemberStats[]
  expand: MemberStats[]
  maintenance: MemberStats[]
  projectNames: Record<string, string>
}) {
  const [tab, setTab] = useState<ProjectKind>('main')
  const data = tab === 'main' ? main : tab === 'expand' ? expand : maintenance
  const counts: Record<ProjectKind, number> = { main: main.length, expand: expand.length, maintenance: maintenance.length }

  /** ดาวน์โหลดอันดับของแท็บปัจจุบันเป็น CSV (มี BOM ให้เปิดใน Excel ภาษาไทยไม่เพี้ยน) */
  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const rows = [
      ['อันดับ', 'ชื่อ', 'บทบาท', 'คะแนน', 'Dept load', 'โปรเจกต์', 'งานที่รับ', 'งานเสร็จ', 'สำเร็จ%', 'วันทำการ'],
      ...data.map((s) => [s.rank, s.user.name, s.user.role, s.score, s.departmentLoad, s.projectCount, s.taskTotal, s.taskDone, s.completion, s.workingDays]),
    ]
    const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      {/* แท็บเลือกประเภท — คะแนนแต่ละประเภทคิดแยกกัน */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 ring-1 ring-gray-200">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                'btn-press flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ' +
                (active ? `bg-gradient-to-r ${t.accent} text-white shadow-sm` : 'text-gray-500 hover:text-gray-700')
              }
            >
              {t.label}
              <span className={'rounded-full px-1.5 text-[10px] font-semibold ' + (active ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500')}>
                {counts[t.key]}
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={exportCsv}
        disabled={data.length === 0}
        className="btn-press rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40"
        title="ดาวน์โหลดอันดับแท็บนี้เป็นไฟล์ CSV"
      >
        📥 Export CSV
      </button>
      </div>
      <p className="mb-4 text-[11px] text-gray-400">
        กำลังแสดงคะแนนของ <span className="font-medium text-gray-500">{TABS.find((t) => t.key === tab)?.label}</span> — คิดจากโปรเจกต์ประเภทนี้ด้วยน้ำหนักเฉพาะของมัน (ตั้งค่าได้ที่ Control Data)
      </p>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีข้อมูลสำหรับประเภทนี้</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {data.map((s) => {
            const medal = MEDALS[s.rank]
            return (
              <div
                key={s.user.id}
                className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 ${medal?.ring ?? ''}`}
              >
                {medal && <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${medal.bar}`} />}

                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  {medal && <span className="text-lg leading-none" title={medal.label}>{medal.icon}</span>}
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${medal?.badge ?? 'bg-gray-100 text-gray-500'}`} title={`อันดับ ${s.rank}`}>
                    #{s.rank}
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-3 pr-16">
                  <Avatar user={s.user} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-gray-900">{s.user.name}</span>
                      {s.rank === 1 && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">Champion</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">{s.user.role} · score <span className="font-mono font-semibold text-indigo-600">{s.score}</span></div>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-4 gap-2 text-center">
                  <Metric label="Dept load" value={s.departmentLoad} highlight />
                  <Metric label="โปรเจกต์" value={s.projectCount} />
                  <Metric label="งานที่รับ" value={s.taskTotal} />
                  <Metric label="วันทำการ" value={s.workingDays} />
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>ส่งงานสำเร็จ <span className="font-mono">{s.taskDone}/{s.taskTotal}</span></span>
                    <span className="font-mono font-medium text-gray-700">{s.completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[width] duration-700" style={{ width: `${s.completion}%` }} />
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(['done', 'on-track', 'at-risk', 'overdue'] as const).map((k) =>
                    s.byStatus[k] > 0 ? (
                      <span key={k} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: STATUS_META[k].bg, color: STATUS_META[k].fg }}>
                        {STATUS_META[k].symbol} {STATUS_META[k].label} {s.byStatus[k]}
                      </span>
                    ) : null,
                  )}
                </div>

                {s.projectScores.length > 0 && (
                  <div className="space-y-1 border-t border-gray-100 pt-2.5">
                    <div className="mb-1 text-[10px] font-medium text-gray-400">คะแนนแยกรายโปรเจกต์</div>
                    {s.projectScores.map((ps) => (
                      <div key={ps.projectId} className="flex items-center gap-2 text-[11px]">
                        <span className="truncate text-gray-600" title={projectNames[ps.projectId] ?? ps.projectId}>{projectNames[ps.projectId] ?? ps.projectId}</span>
                        <span className="rounded bg-indigo-50 px-1 py-0.5 text-[9px] font-medium text-indigo-500" title="จำนวน Department">{ps.deptCount} dept</span>
                        {ps.lateDays > 0 && <span className="rounded bg-red-50 px-1 py-0.5 text-[9px] font-medium text-red-500" title="วันทำการที่ล่าช้า (หักคะแนน)">ช้า {ps.lateDays} วัน</span>}
                        <span className="ml-auto shrink-0 font-mono font-semibold text-gray-700">{ps.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg py-2 ${highlight ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'bg-gray-50'}`}>
      <div className={`font-mono text-lg font-semibold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</div>
      <div className={`text-[10px] ${highlight ? 'text-indigo-400' : 'text-gray-400'}`}>{label}</div>
    </div>
  )
}
