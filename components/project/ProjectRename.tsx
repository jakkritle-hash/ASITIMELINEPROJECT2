'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { renameProjectAction } from '@/app/actions/projects'

/** ชื่อโปรเจกต์ที่แก้ไขได้ทุกเมื่อ (inline) — เฉพาะผู้ที่แก้โปรเจกต์ได้ */
export function ProjectRename({ projectId, name, canEdit }: { projectId: string; name: string; canEdit: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const [pending, setPending] = useState(false)

  function save() {
    const clean = val.trim()
    if (!clean || clean === name) { setEditing(false); return }
    setPending(true)
    renameProjectAction(projectId, clean)
      .then((r) => {
        if (r.ok) { setEditing(false); router.refresh() }
        else { alert(r.error || 'เปลี่ยนชื่อไม่สำเร็จ'); setVal(name) }
      })
      .finally(() => setPending(false))
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1.5">
        <input
          autoFocus
          value={val}
          disabled={pending}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save() }
            if (e.key === 'Escape') { setVal(name); setEditing(false) }
          }}
          className="min-w-0 rounded-lg border border-indigo-200 px-2 py-1 text-lg font-semibold text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/50 sm:text-xl"
        />
        <button onClick={save} disabled={pending} className="btn-press shrink-0 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {pending ? '…' : 'บันทึก'}
        </button>
        <button onClick={() => { setVal(name); setEditing(false) }} className="shrink-0 rounded-md px-1.5 py-1 text-xs text-gray-400 hover:text-gray-600">
          ยกเลิก
        </button>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5">
      <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">{name}</h1>
      {canEdit && (
        <button onClick={() => { setVal(name); setEditing(true) }} title="เปลี่ยนชื่อโปรเจกต์" className="text-gray-300 transition hover:text-indigo-500">
          ✎
        </button>
      )}
    </span>
  )
}
