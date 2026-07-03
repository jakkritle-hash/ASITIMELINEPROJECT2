'use client'

import { useState } from 'react'
import type { User, Role } from '@/lib/domain/types'
import { updateUserRole, toggleUserActive } from '@/lib/domain/adminOps'
import { setRoleAction, toggleActiveAction, deleteMemberAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

const ROLES: Role[] = ['Admin', 'Manager', 'Member']

export function MembersTable({
  users: initial,
  canEdit = true,
  currentUserId,
}: {
  users: User[]
  canEdit?: boolean
  currentUserId?: string
}) {
  const [users, setUsers] = useState<User[]>(initial)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function handleDelete(userId: string) {
    setConfirmId(null)
    setUsers((prev) => prev.filter((u) => u.id !== userId)) // optimistic
    void deleteMemberAction(userId).then((r) => {
      if (!r.ok) {
        // คืนค่ากลับถ้าเซิร์ฟเวอร์ปฏิเสธ (เช่น ลบตัวเอง)
        setUsers(initial)
        if (r.error) alert(r.error)
      }
    })
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] uppercase tracking-wide text-gray-400">
            <th className="px-4 py-2.5 font-semibold">ผู้ใช้</th>
            <th className="px-4 py-2.5 font-semibold">อีเมล</th>
            <th className="px-4 py-2.5 font-semibold">บทบาท</th>
            <th className="px-4 py-2.5 font-semibold">สถานะ</th>
            <th className="px-4 py-2.5 text-right font-semibold">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = currentUserId != null && u.id === currentUserId
            return (
            <tr key={u.id} className="border-b border-gray-50 transition last:border-0 hover:bg-indigo-50/30">
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-2.5">
                  <Avatar user={u} size={26} />
                  <span className={`font-medium ${u.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {u.name}
                    {isSelf && <span className="ml-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500">คุณ</span>}
                  </span>
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-[12px] text-gray-500">{u.email}</td>
              <td className="px-4 py-2.5">
                <select
                  value={u.role}
                  onChange={(e) => {
                    const role = e.target.value as Role
                    setUsers((prev) => updateUserRole(prev, u.id, role))
                    void setRoleAction(u.id, role).then((r) => {
                      if (!r.ok) {
                        setUsers(initial)
                        if (r.error) alert(r.error)
                      }
                    })
                  }}
                  disabled={!canEdit}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => {
                    setUsers((prev) => toggleUserActive(prev, u.id))
                    void toggleActiveAction(u.id).then((r) => {
                      if (!r.ok) {
                        setUsers(initial)
                        if (r.error) alert(r.error)
                      }
                    })
                  }}
                  disabled={!canEdit || isSelf}
                  title={isSelf ? 'ปิด/เปิดบัญชีตัวเองไม่ได้' : u.active ? 'ปิดการเข้าใช้งาน' : 'เปิดการเข้าใช้งาน'}
                  className={
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ' +
                    (canEdit && !isSelf ? 'hover:opacity-80 ' : 'cursor-not-allowed opacity-60 ') +
                    (u.active ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200')
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {u.active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-4 py-2.5 text-right">
                {canEdit && !isSelf ? (
                  confirmId === u.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-red-600"
                      >
                        ยืนยันลบ
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-50"
                      >
                        ยกเลิก
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(u.id)}
                      title="ลบสมาชิกถาวร"
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      ลบ
                    </button>
                  )
                ) : (
                  <span className="text-[11px] text-gray-300">—</span>
                )}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
