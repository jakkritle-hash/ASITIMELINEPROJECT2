'use client'

import { useState } from 'react'
import type { User } from '@/lib/domain/types'
import { PAGES } from '@/lib/domain/pages'
import { effectivePageAccess, normalizePageAccess } from '@/lib/domain/permissions'
import { setUserPageAccessAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

/** ตารางคุมสิทธิ์เห็นหน้า: รายบุคคล × รายหน้า (toggle) — Admin เห็นทุกหน้าเสมอ */
export function PageAccessMatrix({ users: initial, canEdit = true }: { users: User[]; canEdit?: boolean }) {
  const [users, setUsers] = useState<User[]>(initial)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [err, setErr] = useState('')

  function toggle(userId: string, pageKey: string, currentlyAllowed: boolean) {
    if (!canEdit || saving[userId]) return // กันกดรัวจนยิงซ้อน (ลด quota + กันสถานะเพี้ยน)
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const prevAccess = user.pageAccess
    const current = effectivePageAccess(user)
    const next = currentlyAllowed ? current.filter((k) => k !== pageKey) : [...new Set([...current, pageKey])]
    const optimistic = normalizePageAccess(next)

    setErr('')
    setSaving((s) => ({ ...s, [userId]: true }))
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, pageAccess: optimistic } : u)))

    setUserPageAccessAction(userId, next)
      .then((res) => {
        if (!res.ok) {
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, pageAccess: prevAccess } : u)))
          setErr(res.error === 'forbidden' ? 'เฉพาะ Admin เท่านั้น' : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')
        }
      })
      .catch(() => {
        // เช่น Sheets quota (429) ชั่วคราว — คืนสถานะเดิม แล้วให้ลองใหม่
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, pageAccess: prevAccess } : u)))
        setErr('บันทึกไม่สำเร็จ (อาจติดลิมิตชั่วคราว) — รอสักครู่แล้วลองใหม่')
      })
      .finally(() => setSaving((s) => ({ ...s, [userId]: false })))
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      {err && <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{err}</p>}
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
            <th className="p-3 font-medium">ผู้ใช้</th>
            {PAGES.map((p) => (
              <th key={p.key} className="p-3 text-center font-medium">{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isAdmin = u.role === 'Admin'
            return (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="p-3">
                  <span className="flex items-center gap-2">
                    <Avatar user={u} size={22} />
                    <span className={u.active ? 'text-gray-800' : 'text-gray-400'}>{u.name}</span>
                    {isAdmin && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-600">Admin</span>}
                  </span>
                </td>
                {PAGES.map((p) => {
                  if (isAdmin) {
                    return (
                      <td key={p.key} className="p-3 text-center">
                        <span className="text-[11px] text-gray-300" title="Admin เห็นทุกหน้าเสมอ">ทุกหน้า</span>
                      </td>
                    )
                  }
                  const allowed = effectivePageAccess(u).includes(p.key)
                  return (
                    <td key={p.key} className="p-3 text-center">
                      <button
                        onClick={() => toggle(u.id, p.key, allowed)}
                        disabled={!canEdit || saving[u.id]}
                        role="switch"
                        aria-checked={allowed}
                        aria-label={`${u.name} เห็น ${p.label}`}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${allowed ? 'bg-indigo-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${allowed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
