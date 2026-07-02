'use client'

import { useState, useTransition } from 'react'
import type { Team } from '@/lib/domain/types'
import { createProjectAction } from '@/app/actions/projects'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function NewProjectDialog({ teams }: { teams: Team[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [startDate, setStartDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  function submit() {
    if (!name.trim() || !dueDate) {
      setError('กรอกชื่อและวันครบกำหนด')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await createProjectAction({ name, teamId, startDate, dueDate, description })
      if (!res.ok) {
        setError(res.error || 'สร้างไม่สำเร็จ')
        return
      }
      setOpen(false)
      setName('')
      setDueDate('')
      setDescription('')
      // revalidatePath ใน server action อัปเดตหน้าให้อยู่แล้ว — ไม่ต้อง router.refresh()
      // (การเรียก refresh ซ้อนใน transition ทำให้ RSC stream ถูก abort → "Connection closed")
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        <span className="text-base leading-none">+</span> New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-base font-semibold text-gray-900">สร้างโปรเจกต์ใหม่</h2>
            <div className="space-y-3">
              <Field label="ชื่อโปรเจกต์ *">
                <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น เว็บใหม่ Q4" autoFocus />
              </Field>
              <Field label="ทีม">
                <select className="fld" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  <option value="">— ไม่ระบุ —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-3">
                <Field label="วันเริ่ม"><input type="date" className="fld" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
                <Field label="วันครบกำหนด *"><input type="date" className="fld" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
              </div>
              <Field label="รายละเอียด">
                <textarea className="fld" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">ยกเลิก</button>
              <button onClick={submit} disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {pending ? 'กำลังสร้าง…' : 'สร้าง'}
              </button>
            </div>
          </div>
          <style>{`.fld{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:13px;outline:none}.fld:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.25)}`}</style>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-[11px] font-medium text-gray-500">{label}</span>
      {children}
    </label>
  )
}
