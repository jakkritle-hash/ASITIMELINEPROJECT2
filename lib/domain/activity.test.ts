import { describe, it, expect } from 'vitest'
import { applyTaskEdit, makeMoveLog } from './activity'
import type { Task } from './types'

const task: Task = {
  id: 'a', projectId: 'p1', title: 'เดิม', assigneeId: 'u1', columnStatus: 'To Do',
  startDate: '2026-07-01', dueDate: '2026-07-10', slaStatus: 'on-track', editCount: 2,
  description: '', order: 0, createdAt: '', updatedAt: '',
}

describe('applyTaskEdit', () => {
  it('เพิ่ม editCount และสร้าง log ต่อฟิลด์ที่เปลี่ยน', () => {
    const { task: t, logs } = applyTaskEdit(task, { title: 'ใหม่' }, 'u9', '2026-07-01T00:00:00Z')
    expect(t.editCount).toBe(3)
    expect(t.title).toBe('ใหม่')
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({ field: 'title', oldValue: 'เดิม', newValue: 'ใหม่', action: 'update', actorId: 'u9' })
  })
  it('ไม่เปลี่ยนอะไร = ไม่เพิ่ม editCount, ไม่มี log', () => {
    const { task: t, logs } = applyTaskEdit(task, { title: 'เดิม' }, 'u9', '2026-07-01T00:00:00Z')
    expect(t.editCount).toBe(2)
    expect(logs).toHaveLength(0)
  })
})

describe('makeMoveLog', () => {
  it('สร้าง log action=move', () => {
    const log = makeMoveLog(task, 'Done', 'u9', '2026-07-01T00:00:00Z')
    expect(log).toMatchObject({ action: 'move', field: 'columnStatus', oldValue: 'To Do', newValue: 'Done' })
  })
})
