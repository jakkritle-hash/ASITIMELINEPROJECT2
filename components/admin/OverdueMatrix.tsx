'use client'

import { useState } from 'react'
import type { ProjectKind } from '@/lib/domain/types'
import { setProjectOverduePenaltyAction } from '@/app/actions/projects'
import { KindBadge } from '@/components/project/ProjectKind'

export interface OverdueRow {
  id: string
  name: string
  kind: ProjectKind
  overduePenalty: boolean
}

/** ลิสต์เปิด/ปิดการหักคะแนนความล่าช้า (Overdue) รายโปรเจกต์ — sync ไปหน้า Performance ทันที */
export function OverdueMatrix({ projects: initial, readOnly = false }: { projects: OverdueRow[]; readOnly?: boolean }) {
  const [rows, setRows] = useState<OverdueRow[]>(initial)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [err, setErr] = useState('')

  function toggle(id: string, next: boolean) {
    if (readOnly || saving[id]) return
    setErr('')
    setSaving((s) => ({ ...s, [id]: true }))
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, overduePenalty: next } : r))) // optimistic
    setProjectOverduePenaltyAction(id, next)
      .then((res) => {
        if (!res.ok) {
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, overduePenalty: !next } : r)))
          setErr(res.error || 'บันทึกไม่สำเร็จ')
        }
      })
      .catch(() => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, overduePenalty: !next } : r)))
        setErr('บันทึกไม่สำเร็จ (อาจติดลิมิตชั่วคราว) — ลองใหม่อีกครั้ง')
      })
      .finally(() => setSaving((s) => ({ ...s, [id]: false })))
  }

  if (rows.length === 0) return <p className="text-xs text-gray-400">ยังไม่มีโปรเจกต์</p>

  return (
    <div>
      {err && <p className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{err}</p>}
      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-indigo-50/40">
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700" title={r.name}>{r.name}</span>
            <KindBadge kind={r.kind} />
            <span className={'w-14 text-right text-[10px] font-medium ' + (r.overduePenalty ? 'text-rose-500' : 'text-gray-300')}>
              {r.overduePenalty ? 'หักคะแนน' : 'ไม่หัก'}
            </span>
            <button
              onClick={() => toggle(r.id, !r.overduePenalty)}
              disabled={readOnly || saving[r.id]}
              role="switch"
              aria-checked={r.overduePenalty}
              aria-label={`คิด Overdue ของ ${r.name}`}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                r.overduePenalty ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-inner shadow-rose-700/20' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.25)] transition duration-200 ${
                  r.overduePenalty ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
