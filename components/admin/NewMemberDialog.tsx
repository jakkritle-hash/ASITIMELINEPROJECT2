'use client'

import { useState, useTransition } from 'react'
import type { Role } from '@/lib/domain/types'
import { createMemberAction } from '@/app/actions/admin'

const ROLES: Role[] = ['Admin', 'Manager', 'Member']

export function NewMemberDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('Member')

  function submit() {
    if (!email.trim()) {
      setError('กรอกอีเมล')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await createMemberAction({ email, name, role })
      if (!res.ok) {
        setError(res.error || 'เพิ่มไม่สำเร็จ')
        return
      }
      setOpen(false)
      setEmail('')
      setName('')
      setRole('Member')
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        <span className="text-base leading-none">+</span> เพิ่มสมาชิก
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="mb-1 text-base font-semibold text-gray-900">เพิ่มสมาชิกใหม่</h2>
            <p className="mb-4 text-[11px] text-gray-500">ปกติสมาชิกจะถูกเพิ่มอัตโนมัติเมื่อล็อกอิน Google — ใช้ช่องนี้เพื่อเพิ่มล่วงหน้า</p>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-gray-500">อีเมล * (@planbmedia.co.th)</span>
                <input className="fld" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@planbmedia.co.th" autoFocus />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-gray-500">ชื่อ</span>
                <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อที่แสดง" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-gray-500">บทบาท</span>
                <select className="fld" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">ยกเลิก</button>
              <button onClick={submit} disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {pending ? 'กำลังเพิ่ม…' : 'เพิ่มสมาชิก'}
              </button>
            </div>
          </div>
          <style>{`.fld{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:13px;outline:none}.fld:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.25)}`}</style>
        </div>
      )}
    </>
  )
}
