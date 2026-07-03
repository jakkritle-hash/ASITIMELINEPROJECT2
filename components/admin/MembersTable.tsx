'use client'

import { useState } from 'react'
import type { User, Role } from '@/lib/domain/types'
import { updateUserRole, toggleUserActive } from '@/lib/domain/adminOps'
import { setRoleAction, toggleActiveAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

const ROLES: Role[] = ['Admin', 'Manager', 'Member']

export function MembersTable({ users: initial, canEdit = true }: { users: User[]; canEdit?: boolean }) {
  const [users, setUsers] = useState<User[]>(initial)

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] uppercase tracking-wide text-gray-400">
            <th className="px-4 py-2.5 font-semibold">ผู้ใช้</th>
            <th className="px-4 py-2.5 font-semibold">อีเมล</th>
            <th className="px-4 py-2.5 font-semibold">บทบาท</th>
            <th className="px-4 py-2.5 font-semibold">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-50 transition last:border-0 hover:bg-indigo-50/30">
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-2.5">
                  <Avatar user={u} size={26} />
                  <span className={`font-medium ${u.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{u.name}</span>
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-[12px] text-gray-500">{u.email}</td>
              <td className="px-4 py-2.5">
                <select
                  value={u.role}
                  onChange={(e) => {
                    const role = e.target.value as Role
                    setUsers((prev) => updateUserRole(prev, u.id, role))
                    void setRoleAction(u.id, role)
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
                    void toggleActiveAction(u.id)
                  }}
                  disabled={!canEdit}
                  className={
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ' +
                    (canEdit ? 'hover:opacity-80 ' : 'cursor-not-allowed opacity-60 ') +
                    (u.active ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200')
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {u.active ? 'Active' : 'Inactive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
