import type { Task, ActivityLogEntry } from './types'

/** ฟิลด์ของ Task ที่แก้ไขได้และต้องบันทึก log */
const EDITABLE_FIELDS: (keyof Task)[] = ['title', 'description', 'assigneeId', 'startDate', 'dueDate']

/**
 * ใช้การแก้ไขกับ task: ถ้ามีฟิลด์เปลี่ยนจริง → editCount+1 และสร้าง log ต่อฟิลด์
 * คืน task ใหม่ + รายการ log (ว่างถ้าไม่มีอะไรเปลี่ยน)
 */
export function applyTaskEdit(
  task: Task,
  changes: Partial<Task>,
  actorId: string,
  timestamp: string,
): { task: Task; logs: ActivityLogEntry[] } {
  const logs: ActivityLogEntry[] = []
  const updated: Task = { ...task }

  for (const field of EDITABLE_FIELDS) {
    if (field in changes) {
      const oldValue = String(task[field] ?? '')
      const newValue = String(changes[field] ?? '')
      if (oldValue !== newValue) {
        ;(updated[field] as unknown) = changes[field]
        logs.push({
          id: `${task.id}-${timestamp}-${field}`,
          timestamp,
          actorId,
          entityType: 'task',
          entityId: task.id,
          action: 'update',
          field,
          oldValue,
          newValue,
        })
      }
    }
  }

  if (logs.length > 0) {
    updated.editCount = task.editCount + 1
    updated.updatedAt = timestamp
  }
  return { task: updated, logs }
}

/** สร้าง log สำหรับการย้ายคอลัมน์ (action=move) */
export function makeMoveLog(task: Task, toColumn: string, actorId: string, timestamp: string): ActivityLogEntry {
  return {
    id: `${task.id}-${timestamp}-move`,
    timestamp,
    actorId,
    entityType: 'task',
    entityId: task.id,
    action: 'move',
    field: 'columnStatus',
    oldValue: task.columnStatus,
    newValue: toColumn,
  }
}
