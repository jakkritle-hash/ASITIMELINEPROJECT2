import { describe, it, expect } from 'vitest'
import { groupByColumn, moveTask } from './kanban'
import type { Task } from './types'

const base: Omit<Task, 'id' | 'columnStatus' | 'order'> = {
  projectId: 'p1', title: 'T', assigneeId: 'u1', startDate: '2026-07-01', dueDate: '2026-07-10',
  slaStatus: 'on-track', editCount: 0, description: '', createdAt: '', updatedAt: '',
}
const tasks: Task[] = [
  { ...base, id: 'a', columnStatus: 'To Do', order: 0 },
  { ...base, id: 'b', columnStatus: 'To Do', order: 1 },
  { ...base, id: 'c', columnStatus: 'Done', order: 0 },
]

describe('groupByColumn', () => {
  it('จัดกลุ่มตามคอลัมน์ เรียงตาม order', () => {
    const g = groupByColumn(tasks, ['To Do', 'In Progress', 'Done'])
    expect(g['To Do'].map((t) => t.id)).toEqual(['a', 'b'])
    expect(g['In Progress']).toEqual([])
    expect(g['Done'].map((t) => t.id)).toEqual(['c'])
  })
})

describe('moveTask', () => {
  it('ย้าย task ไปคอลัมน์ปลายทางและอัปเดต columnStatus', () => {
    const next = moveTask(tasks, 'a', 'Done')
    const moved = next.find((t) => t.id === 'a')!
    expect(moved.columnStatus).toBe('Done')
  })
  it('ไม่แตะ task อื่น', () => {
    const next = moveTask(tasks, 'a', 'Done')
    expect(next.find((t) => t.id === 'b')!.columnStatus).toBe('To Do')
  })
})
