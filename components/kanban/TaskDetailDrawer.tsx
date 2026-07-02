'use client'

import { useState } from 'react'
import type { EnrichedTask } from '@/lib/data/dashboard'
import type { User, ActivityLogEntry } from '@/lib/domain/types'
import { STATUS_META } from '@/components/ui/StatusBadge'

const ACTION_LABEL: Record<string, string> = { create: 'สร้าง', update: 'แก้ไข', move: 'ย้าย', delete: 'ลบ' }
const FIELD_LABEL: Record<string, string> = {
  title: 'ชื่องาน', description: 'รายละเอียด', assigneeId: 'ผู้รับผิดชอบ',
  startDate: 'วันเริ่ม', dueDate: 'วันครบกำหนด', columnStatus: 'สถานะ',
}

function fmtTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function TaskDetailDrawer({
  task,
  users,
  logs,
  onSave,
  onClose,
}: {
  task: EnrichedTask
  users: User[]
  logs: ActivityLogEntry[]
  onSave: (changes: Partial<EnrichedTask>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [assigneeId, setAssigneeId] = useState(task.assigneeId)
  const [startDate, setStartDate] = useState(task.startDate)
  const [dueDate, setDueDate] = useState(task.dueDate)

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-900">รายละเอียดงาน</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-3 p-4">
          <Field label="ชื่องาน">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="รายละเอียด">
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="ผู้รับผิดชอบ">
            <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3">
            <Field label="วันเริ่ม"><input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="วันครบกำหนด"><input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="rounded px-2 py-0.5" style={{ backgroundColor: STATUS_META[task.slaStatus].bg, color: STATUS_META[task.slaStatus].fg }}>
              {STATUS_META[task.slaStatus].symbol} {STATUS_META[task.slaStatus].label}
            </span>
            <span>✏️ แก้ไข {task.editCount} ครั้ง</span>
          </div>

          <button
            onClick={() => onSave({ title, description, assigneeId, startDate, dueDate })}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            บันทึก
          </button>
        </div>

        <div className="border-t border-gray-100 p-4">
          <h3 className="mb-2 text-xs font-semibold text-gray-700">📜 Activity Log</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-gray-400">ยังไม่มีการเปลี่ยนแปลง</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((l) => (
                <li key={l.id} className="border-l-2 border-gray-200 pl-3 text-xs text-gray-600">
                  <b>{userName(l.actorId)}</b> {ACTION_LABEL[l.action] ?? l.action}{' '}
                  <span className="text-gray-500">{FIELD_LABEL[l.field] ?? l.field}</span>
                  {l.action === 'update' && (
                    <span className="text-gray-400"> : {l.oldValue || '—'} → {l.newValue || '—'}</span>
                  )}
                  {l.action === 'move' && <span className="text-gray-400"> : {l.oldValue} → {l.newValue}</span>}
                  <div className="text-[10px] text-gray-400">{fmtTime(l.timestamp)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <style>{`.input{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;font-size:13px;outline:none}.input:focus{border-color:#93c5fd}`}</style>
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
