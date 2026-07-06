'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setProjectDatesAction } from '@/app/actions/projects'

/** วันเริ่ม → วันครบกำหนดของโปรเจกต์ — ยืด/ขยาย Timeline ได้ทุกเมื่อ (log อัตโนมัติ) */
export function ProjectDates({
  projectId,
  startDate,
  dueDate,
  canEdit,
}: {
  projectId: string
  startDate: string
  dueDate: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [s, setS] = useState(startDate)
  const [d, setD] = useState(dueDate)
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState('')

  function save() {
    setErr('')
    setPending(true)
    setProjectDatesAction(projectId, s, d)
      .then((r) => {
        if (r.ok) { setEditing(false); router.refresh() }
        else setErr(r.error || 'บันทึกไม่สำเร็จ')
      })
      .finally(() => setPending(false))
  }

  if (editing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
        <input type="date" value={s} onChange={(e) => setS(e.target.value)} disabled={pending} className="rounded-md border border-gray-200 px-1.5 py-0.5 text-xs outline-none focus:border-indigo-300" />
        <span className="text-gray-400">→</span>
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} disabled={pending} className="rounded-md border border-gray-200 px-1.5 py-0.5 text-xs outline-none focus:border-indigo-300" />
        <button onClick={save} disabled={pending} className="btn-press rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {pending ? '…' : 'บันทึก'}
        </button>
        <button onClick={() => { setS(startDate); setD(dueDate); setEditing(false); setErr('') }} className="rounded-md px-1 py-0.5 text-[11px] text-gray-400 hover:text-gray-600">
          ยกเลิก
        </button>
        {err && <span className="text-[11px] text-red-500">{err}</span>}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{startDate} → {dueDate}</span>
      {canEdit && (
        <button onClick={() => { setS(startDate); setD(dueDate); setEditing(true) }} title="ยืด/ขยาย Timeline" className="text-gray-300 transition hover:text-indigo-500">
          ✎
        </button>
      )}
    </span>
  )
}
