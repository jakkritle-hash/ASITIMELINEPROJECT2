'use client'

import { useState } from 'react'
import type { EnrichedProject, EnrichedTask } from '@/lib/data/dashboard'
import type { User, ActivityLogEntry } from '@/lib/domain/types'
import { groupByColumn } from '@/lib/domain/kanban'
import { applyTaskEdit, makeMoveLog } from '@/lib/domain/activity'
import { computeSlaStatus } from '@/lib/domain/sla'
import { workingDaysBetween } from '@/lib/domain/workingDays'
import { TH_HOLIDAYS } from '@/lib/domain/holidays'
import { moveTaskAction, editTaskAction } from '@/app/actions/tasks'
import { TaskCard } from './TaskCard'
import { TaskDetailDrawer } from './TaskDetailDrawer'

const TZ = 'Asia/Bangkok'
const AT_RISK_DAYS = 2
// ผู้ใช้ปัจจุบัน (จะแทนด้วย session จริงเมื่อต่อ auth) — ใช้ actor คนแรกเป็น placeholder
const CURRENT_USER = 'u1'

function recomputeSla(task: EnrichedTask): EnrichedTask {
  const isDone = task.columnStatus.toLowerCase() === 'done'
  return { ...task, slaStatus: computeSlaStatus({ dueDate: task.dueDate, isDone, now: new Date(), tz: TZ, atRiskDays: AT_RISK_DAYS }) }
}

function groupLogs(logs: ActivityLogEntry[]): Record<string, ActivityLogEntry[]> {
  const g: Record<string, ActivityLogEntry[]> = {}
  for (const l of logs) (g[l.entityId] ??= []).push(l)
  return g
}

export function KanbanBoard({
  project,
  users,
  initialLogs = [],
}: {
  project: EnrichedProject
  users: User[]
  initialLogs?: ActivityLogEntry[]
}) {
  const [tasks, setTasks] = useState<EnrichedTask[]>(project.tasks)
  const [logsByTask, setLogsByTask] = useState<Record<string, ActivityLogEntry[]>>(() => groupLogs(initialLogs))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const grouped = groupByColumn(tasks, project.kanbanColumns) as Record<string, EnrichedTask[]>
  const selected = tasks.find((t) => t.id === selectedId) ?? null
  const usersById = new Map(users.map((u) => [u.id, u]))

  function addLogs(taskId: string, entries: ActivityLogEntry[]) {
    if (entries.length === 0) return
    setLogsByTask((prev) => ({ ...prev, [taskId]: [...entries, ...(prev[taskId] ?? [])] }))
  }

  function handleDrop(taskId: string, toColumn: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.columnStatus === toColumn) return
    const log = makeMoveLog(task, toColumn, CURRENT_USER, new Date().toISOString())
    // map บน enriched state โดยตรง (ไม่ผ่าน moveTask ที่คืน type Task[] ทำให้เสีย workingDays)
    const moved = tasks.map((t) => (t.id === taskId ? recomputeSla({ ...t, columnStatus: toColumn }) : t))
    setTasks(moved)
    addLogs(taskId, [log])
    void moveTaskAction(taskId, toColumn) // persist (no-op ถ้ายังไม่ต่อ Sheet)
  }

  function handleSave(taskId: string, changes: Partial<EnrichedTask>) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const { task: edited, logs } = applyTaskEdit(task, changes, CURRENT_USER, new Date().toISOString())
    const withDerived = recomputeSla({
      ...edited,
      assignee: usersById.get(edited.assigneeId),
      workingDays: workingDaysBetween(edited.startDate, edited.dueDate, TH_HOLIDAYS),
    })
    setTasks((prev) => prev.map((t) => (t.id === taskId ? withDerived : t)))
    addLogs(taskId, logs)
    if (logs.length > 0) void editTaskAction(taskId, changes, task.updatedAt) // persist
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {project.kanbanColumns.map((col) => (
        <div
          key={col}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e.dataTransfer.getData('text/plain'), col)}
          className="flex min-h-[60vh] min-w-[220px] flex-1 flex-col rounded-xl bg-gray-100 p-2"
        >
          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-gray-600">
            <span>{col}</span>
            <span className="text-gray-400">{grouped[col]?.length ?? 0}</span>
          </div>
          <div className="flex flex-col gap-2">
            {grouped[col]?.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onClick={() => setSelectedId(t.id)}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <TaskDetailDrawer
          task={selected}
          users={users}
          logs={logsByTask[selected.id] ?? []}
          onSave={(changes) => handleSave(selected.id, changes)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
