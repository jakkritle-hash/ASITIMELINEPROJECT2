'use client'

import { useState, useTransition } from 'react'
import { setProjectDepartmentsAction } from '@/app/actions/projects'
import { DepartmentPicker } from './DepartmentPicker'

/** แสดง Department ที่ใช้โปรเจกต์ + แก้ไข/เพิ่มได้ทุกเมื่อ (ส่งกลับมาที่หน้า Approve) */
export function ProjectDepartments({ projectId, departments }: { projectId: string; departments: string[] }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string[]>(departments)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function save() {
    setError('')
    startTransition(async () => {
      const res = await setProjectDepartmentsAction(projectId, draft)
      if (!res.ok) {
        setError(res.error || 'บันทึกไม่สำเร็จ')
        return
      }
      setEditing(false)
      // revalidatePath ใน action อัปเดตหน้าเอง — ไม่ต้อง router.refresh (กัน "Connection closed")
    })
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
        <div className="mb-2 text-[11px] font-medium text-gray-500">เลือก Department ที่ใช้โปรเจกต์นี้ (เลือกได้หลายแผนก)</div>
        <DepartmentPicker value={draft} onChange={setDraft} disabled={pending} />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'กำลังบันทึก…' : `บันทึก (${draft.length})`}
          </button>
          <button
            onClick={() => {
              setDraft(departments)
              setEditing(false)
            }}
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium text-gray-400">Departments:</span>
      {departments.length === 0 ? (
        <span className="text-[11px] text-gray-400">— ยังไม่ระบุ —</span>
      ) : (
        departments.map((d) => (
          <span key={d} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100">
            {d}
          </span>
        ))
      )}
      <button
        onClick={() => {
          setDraft(departments)
          setEditing(true)
        }}
        className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
      >
        ✎ แก้ไข
      </button>
    </div>
  )
}
