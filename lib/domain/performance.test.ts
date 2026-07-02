import { describe, it, expect } from 'vitest'
import { computePerformance, type PerfTask, type PerfProject } from './performance'
import type { User } from './types'

const u = (id: string): User => ({ id, email: `${id}@x`, name: id, role: 'Member', avatarColor: '#000', active: true, createdAt: '' })
const users = [u('u1'), u('u2')]

const task = (assigneeId: string, projectId: string, columnStatus: string, slaStatus: PerfTask['slaStatus'], workingDays: number): PerfTask => ({ assigneeId, projectId, columnStatus, slaStatus, workingDays })

const tasks: PerfTask[] = [
  task('u1', 'p1', 'Done', 'done', 5),
  task('u1', 'p1', 'In Progress', 'at-risk', 3),
  task('u1', 'p2', 'To Do', 'overdue', 2),
  task('u2', 'p1', 'Done', 'done', 4),
]
const projects: PerfProject[] = [
  { id: 'p1', memberIds: ['u1', 'u2'], ownerUserId: 'u1' },
  { id: 'p2', memberIds: [], ownerUserId: 'u1' },
  { id: 'p3', memberIds: ['u2'], ownerUserId: 'u2' }, // u2 เป็นสมาชิกแต่ไม่มี task
]

describe('computePerformance', () => {
  const stats = computePerformance(users, tasks, projects)
  const s1 = stats.find((s) => s.user.id === 'u1')!
  const s2 = stats.find((s) => s.user.id === 'u2')!

  it('เรียงตามจำนวนงานมาก→น้อย (u1 ก่อน u2)', () => {
    expect(stats[0].user.id).toBe('u1')
  })
  it('u1: 3 งาน, เสร็จ 1, วันทำการรวม 10', () => {
    expect(s1.taskTotal).toBe(3)
    expect(s1.taskDone).toBe(1)
    expect(s1.workingDays).toBe(10)
    expect(s1.completion).toBe(33)
  })
  it('u1: โปรเจกต์เกี่ยวข้อง = p1, p2 (2)', () => {
    expect(s1.projectCount).toBe(2)
  })
  it('u1: สถานะแยก overdue 1, at-risk 1, done 1', () => {
    expect(s1.byStatus.overdue).toBe(1)
    expect(s1.byStatus['at-risk']).toBe(1)
    expect(s1.byStatus.done).toBe(1)
  })
  it('u2: มี task ใน p1 + เป็นสมาชิก p3 → โปรเจกต์เกี่ยวข้อง 2', () => {
    expect(s2.taskTotal).toBe(1)
    expect(s2.projectCount).toBe(2)
    expect(s2.completion).toBe(100)
  })
})
