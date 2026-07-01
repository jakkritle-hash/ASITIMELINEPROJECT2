'use client'

import { useState } from 'react'
import type { User, Role } from '@/lib/domain/types'
import { updateUserRole, toggleUserActive } from '@/lib/domain/adminOps'
import { setRoleAction, toggleActiveAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

const ROLES: Role[] = ['Admin', 'Manager', 'Member']

export function MembersTable({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initial)

  return (
    <table className="w-full overflow-hidden rounded-xl bg-white text-sm shadow-sm ring-1 ring-gray-100">
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
          <th className="p-3 font-medium">ผู้ใช้</th>
          <th className="p-3 font-medium">อีเมล</th>
          <th className="p-3 font-medium">บทบาท</th>
          <th className="p-3 font-medium">สถานะ</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-gray-50 last:border-0">
            <td className="p-3">
              <span className="flex items-center gap-2">
                <Avatar user={u} size={22} />
                <span className={u.active ? 'text-gray-800' : 'text-gray-400'}>{u.name}</span>
              </span>
            </td>
            <td className="p-3 text-gray-500">{u.email}</td>
            <td className="p-3">
              <select
                value={u.role}
                onChange={(e) => {
                  const role = e.target.value as Role
                  setUsers((prev) => updateUserRole(prev, u.id, role))
                  void setRoleAction(u.id, role)
                }}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-300"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </td>
            <td className="p-3">
              <button
                onClick={() => {
                  setUsers((prev) => toggleUserActive(prev, u.id))
                  void toggleActiveAction(u.id)
                }}
                className={
                  'rounded-md px-2.5 py-1 text-xs font-medium ' +
                  (u.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500')
                }
              >
                {u.active ? 'Active' : 'Inactive'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
