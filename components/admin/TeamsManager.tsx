'use client'

import { useRef, useState } from 'react'
import type { User, Team } from '@/lib/domain/types'
import { createTeam, addTeamMember, removeTeamMember, setTeamLead } from '@/lib/domain/adminOps'
import { createTeamAction, deleteTeamAction, addTeamMemberAction, removeTeamMemberAction, setTeamLeadAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/Avatar'

export function TeamsManager({ users, teams: initial, canEdit = true }: { users: User[]; teams: Team[]; canEdit?: boolean }) {
  const [teams, setTeams] = useState<Team[]>(initial)
  const [newName, setNewName] = useState('')
  const [hint, setHint] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const usersById = new Map(users.map((u) => [u.id, u]))

  function handleCreate() {
    if (!canEdit) return
    const name = newName.trim()
    if (!name) {
      // กันกรณีกดปุ่มโดยยังไม่พิมพ์ชื่อ — ให้ feedback แทนที่จะเงียบ
      setHint('พิมพ์ชื่อทีมก่อนกด New Team')
      inputRef.current?.focus()
      return
    }
    setHint('')
    setTeams((prev) => createTeam(prev, `t${Date.now()}`, name, new Date().toISOString()))
    setNewName('')
    void createTeamAction(name)
  }

  function handleDeleteTeam(teamId: string, teamName: string) {
    if (!canEdit) return
    if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return
    setTeams((prev) => prev.filter((t) => t.id !== teamId))
    void deleteTeamAction(teamId)
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => { setNewName(e.target.value); if (hint) setHint('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
              placeholder="ชื่อทีมใหม่ (เช่น Design)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
            />
            <button onClick={handleCreate} className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              + New Team
            </button>
          </div>
          {hint && <p className="mt-1.5 text-xs text-amber-600">{hint}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((t) => {
        const nonMembers = users.filter((u) => !t.memberIds.includes(u.id))
        return (
          <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{t.name}</h3>
              {canEdit && (
                <button
                  onClick={() => handleDeleteTeam(t.id, t.name)}
                  className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 transition hover:bg-red-50"
                  title="Delete team"
                >
                  🗑 Delete
                </button>
              )}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {t.memberIds.length === 0 && <span className="text-xs text-gray-400">ยังไม่มีสมาชิก</span>}
              {t.memberIds.map((id) => {
                const u = usersById.get(id)
                const isLead = t.leadUserId === id
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full bg-gray-50 py-1 pl-1 pr-2 text-xs ring-1 ring-gray-100">
                    <Avatar user={u} size={18} />
                    <span className="text-gray-700">{u?.name ?? id}</span>
                    {canEdit && (
                      <>
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
                      </>
                    )}
                  </span>
                )
              })}
            </div>
            {canEdit && nonMembers.length > 0 && (
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
    </div>
  )
}
