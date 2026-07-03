'use client'

import { useState, useTransition } from 'react'
import type { Team } from '@/lib/domain/types'
import { setProjectTeamAction } from '@/app/actions/projects'

/** แสดงทีมของโปรเจกต์ + เปลี่ยนทีมได้ทุกเมื่อ (สมาชิกทีมใหม่ sync เข้าโปรเจกต์อัตโนมัติ) */
export function ProjectTeam({ projectId, teamId, teams }: { projectId: string; teamId: string; teams: Team[] }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(teamId)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const current = teams.find((t) => t.id === teamId)

  function save() {
    setError('')
    startTransition(async () => {
      const res = await setProjectTeamAction(projectId, draft)
      if (!res.ok) {
        setError(res.error || 'บันทึกไม่สำเร็จ')
        return
      }
      setEditing(false)
      // revalidatePath ใน action อัปเดตหน้าเอง — ไม่ต้อง router.refresh (กัน "Connection closed")
    })
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400">ทีม:</span>
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={pending}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-blue-300"
        >
          <option value="">— ไม่ระบุ —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
        <button
          onClick={() => { setDraft(teamId); setEditing(false) }}
          disabled={pending}
          className="rounded-lg px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100"
        >
          ยกเลิก
        </button>
        {error && <span className="text-[11px] text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium text-gray-400">ทีม:</span>
      {current ? (
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 ring-1 ring-blue-100">
          👥 {current.name}
        </span>
      ) : (
        <span className="text-[11px] text-gray-400">— ยังไม่ระบุ —</span>
      )}
      <button
        onClick={() => { setDraft(teamId); setEditing(true) }}
        className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
      >
        ✎ แก้ไข
      </button>
    </div>
  )
}
