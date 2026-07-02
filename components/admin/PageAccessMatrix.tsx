'use client'

import { useState } from 'react'
import type { User } from '@/lib/domain/types'
import { CONTENT_PAGES } from '@/lib/domain/pages'
import { setUserPageAccessAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

/** ตารางคุมสิทธิ์เห็นหน้า: รายบุคคล × รายหน้า (toggle) — Admin เห็นทุกหน้าเสมอ */
export function PageAccessMatrix({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initial)

  function toggle(userId: string, pageKey: string, currentlyAllowed: boolean) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u
        const denied = currentlyAllowed ? [...new Set([...u.pageDenied, pageKey])] : u.pageDenied.filter((k) => k !== pageKey)
        void setUserPageAccessAction(userId, denied)
        return { ...u, pageDenied: denied }
      }),
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
            <th className="p-3 font-medium">ผู้ใช้</th>
            {CONTENT_PAGES.map((p) => (
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
                {CONTENT_PAGES.map((p) => {
                  if (isAdmin) {
                    return (
                      <td key={p.key} className="p-3 text-center">
                        <span className="text-[11px] text-gray-300" title="Admin เห็นทุกหน้าเสมอ">ทุกหน้า</span>
                      </td>
                    )
                  }
                  const allowed = !u.pageDenied.includes(p.key)
                  return (
                    <td key={p.key} className="p-3 text-center">
                      <button
                        onClick={() => toggle(u.id, p.key, allowed)}
                        role="switch"
                        aria-checked={allowed}
                        aria-label={`${u.name} เห็น ${p.label}`}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${allowed ? 'bg-indigo-500' : 'bg-gray-300'}`}
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
