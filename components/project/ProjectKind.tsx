'use client'

import { useState, useTransition } from 'react'
import type { ProjectKind as Kind } from '@/lib/domain/types'
import { setProjectKindAction } from '@/app/actions/projects'
import { KindToggle } from './KindToggle'

/** แสดงประเภทโปรเจกต์ (Main/Expand) + สลับได้ทุกเมื่อ — เฉพาะ Admin/Owner (canEdit) */
export function ProjectKind({ projectId, kind, canEdit }: { projectId: string; kind: Kind; canEdit: boolean }) {
  const [value, setValue] = useState<Kind>(kind)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function change(next: Kind) {
    if (next === value) return
    const prev = value
    setValue(next) // optimistic
    setError('')
    startTransition(async () => {
      const res = await setProjectKindAction(projectId, next)
      if (!res.ok) {
        setValue(prev) // คืนค่าเดิมถ้าเซิร์ฟเวอร์ปฏิเสธ
        setError(res.error || 'บันทึกไม่สำเร็จ')
      }
    })
  }

  // อ่านอย่างเดียว (ไม่ใช่ Admin/Owner) — แสดงแค่ป้าย
  if (!canEdit) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400">ประเภท:</span>
        <KindBadge kind={value} />
      </span>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium text-gray-400">ประเภท:</span>
      <KindToggle value={value} onChange={change} disabled={pending} size="sm" />
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </span>
  )
}

/** ป้ายประเภทโปรเจกต์ (ใช้ซ้ำได้) */
export function KindBadge({ kind }: { kind: Kind }) {
  if (kind === 'expand')
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200" title="งานต่อยอด — ไม่นับคะแนน Performance">
        Expand
      </span>
    )
  if (kind === 'maintenance')
    return (
      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-600 ring-1 ring-teal-100" title="งานดูแลรักษา — คิดคะแนนแยก">
        Maintenance
      </span>
    )
  if (kind === 'revise')
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 ring-1 ring-amber-100" title="งานแก้ไข/ปรับปรุง — คิดคะแนนแยก">
        Revise
      </span>
    )
  return (
    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100" title="นับคะแนน Performance">
      Main
    </span>
  )
}
