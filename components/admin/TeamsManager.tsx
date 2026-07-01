'use client'

import { useState } from 'react'
import type { User, Team } from '@/lib/domain/types'
import { createTeam, addTeamMember, removeTeamMember, setTeamLead } from '@/lib/domain/adminOps'
import { createTeamAction, addTeamMemberAction, removeTeamMemberAction, setTeamLeadAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

export function TeamsManager({ users, teams: initial }: { users: User[]; teams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initial)
  const [newName, setNewName] = useState('')
  const usersById = new Map(users.map((u) => [u.id, u]))

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setTeams((prev) => createTeam(prev, `t${Date.now()}`, name, new Date().toISOString()))
    setNewName('')
    void createTeamAction(name)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ชื่อทีมใหม่ (เช่น Design)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
        />
        <button onClick={handleCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + สร้างทีม
        </button>
      </div>

      {teams.map((t) => {
        const nonMembers = users.filter((u) => !t.memberIds.includes(u.id))
        return (
          <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">{t.name}</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {t.memberIds.length === 0 && <span className="text-xs text-gray-400">ยังไม่มีสมาชิก</span>}
              {t.memberIds.map((id) => {
                const u = usersById.get(id)
                const isLead = t.leadUserId === id
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full bg-gray-50 py-1 pl-1 pr-2 text-xs ring-1 ring-gray-100">
                    <Avatar user={u} size={18} />
                    <span className="text-gray-700">{u?.name ?? id}</span>
                    <button
                      onClick={() => { setTeams((prev) => setTeamLead(prev, t.id, id)); void setTeamLeadAction(t.id, id) }}
                      title="ตั้งเป็นหัวหน้าทีม"
                      className={isLead ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => { setTeams((prev) => removeTeamMember(prev, t.id, id)); void removeTeamMemberAction(t.id, id) }}
                      title="ลบออกจากทีม"
                      className="text-gray-300 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                )
              })}
            </div>
            {nonMembers.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const uid = e.target.value
                  if (!uid) return
                  setTeams((prev) => addTeamMember(prev, t.id, uid))
                  void addTeamMemberAction(t.id, uid)
                }}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-300"
              >
                <option value="">+ เพิ่มสมาชิก…</option>
                {nonMembers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}
