'use client'

import { useState, useTransition } from 'react'
import type { User } from '@/lib/domain/types'
import { createTaskAction } from '@/app/actions/tasks'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function NewTaskDialog({ projectId, users }: { projectId: string; users: User[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState(users[0]?.id ?? '')
  const [startDate, setStartDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState('')

  function submit() {
    if (!title.trim() || !dueDate) {
      setError('กรอกชื่องานและวันครบกำหนด')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await createTaskAction(projectId, { title, assigneeId, startDate, dueDate })
      if (!res.ok) {
        setError(res.error || 'สร้างไม่สำเร็จ')
        return
      }
      setOpen(false)
      setTitle('')
      setDueDate('')
      // revalidatePath ใน server action อัปเดตหน้าให้อยู่แล้ว — ไม่ต้อง router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        <span className="text-base leading-none">+</span> New Tasks
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-base font-semibold text-gray-900">เพิ่มงานใหม่</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-gray-500">ชื่องาน *</span>
                <input className="fld" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ออกแบบหน้า Login" autoFocus />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-gray-500">ผู้รับผิดชอบ</span>
                <select className="fld" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="block flex-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-500">วันเริ่ม</span>
                  <input type="date" className="fld" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label className="block flex-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-500">วันครบกำหนด *</span>
                  <input type="date" className="fld" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </label>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">ยกเลิก</button>
              <button onClick={submit} disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {pending ? 'กำลังเพิ่ม…' : 'เพิ่มงาน'}
              </button>
            </div>
          </div>
          <style>{`.fld{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:13px;outline:none}.fld:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.25)}`}</style>
        </div>
      )}
    </>
  )
}
