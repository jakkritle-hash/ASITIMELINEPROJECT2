import { describe, it, expect } from 'vitest'
import { computePerformance, projectScore, type PerfTask, type PerfProject } from './performance'
import type { User } from './types'

const u = (id: string): User => ({ id, email: `${id}@x`, name: id, role: 'Member', avatarColor: '#000', active: true, createdAt: '', pageDenied: [] })
const users = [u('u1'), u('u2')]

const task = (assigneeId: string, projectId: string, columnStatus: string, slaStatus: PerfTask['slaStatus'], workingDays: number): PerfTask => ({ assigneeId, projectId, columnStatus, slaStatus, workingDays })

const tasks: PerfTask[] = [
  task('u1', 'p1', 'Done', 'done', 5),
  task('u1', 'p1', 'In Progress', 'at-risk', 3),
  task('u1', 'p2', 'To Do', 'overdue', 2),
  task('u2', 'p1', 'Done', 'done', 4),
]
const projects: PerfProject[] = [
  { id: 'p1', memberIds: ['u1', 'u2'], ownerUserId: 'u1', departments: ['A', 'B'] }, // 2 depts
  { id: 'p2', memberIds: [], ownerUserId: 'u1', departments: ['C'] }, // 1 dept
  { id: 'p3', memberIds: ['u2'], ownerUserId: 'u2', departments: ['D', 'E', 'F'] }, // 3 depts, u2 สมาชิกแต่ไม่มี task
]

describe('computePerformance', () => {
  const stats = computePerformance(users, tasks, projects)
  const s1 = stats.find((s) => s.user.id === 'u1')!
  const s2 = stats.find((s) => s.user.id === 'u2')!

  it('เรียงตามคะแนนผลงาน: u2 (ส่งครบ 100%) เป็นแชมป์ แม้รับงานน้อยกว่า u1', () => {
    expect(stats[0].user.id).toBe('u2')
    expect(s2.score).toBeGreaterThan(s1.score)
  })
  it('กำหนดอันดับ: u2 = อันดับ 1, u1 = อันดับ 2', () => {
    expect(s2.rank).toBe(1)
    expect(s1.rank).toBe(2)
  })
  it('departmentLoad: รวมจำนวน dept ของทุกโปรเจกต์ที่เกี่ยวข้อง', () => {
    // u1 เกี่ยวข้อง p1(2)+p2(1) = 3 ; u2 เกี่ยวข้อง p1(2)+p3(3) = 5
    expect(s1.departmentLoad).toBe(3)
    expect(s2.departmentLoad).toBe(5)
  })
  it('คิดคะแนนแยกทีละโปรเจกต์แล้วรวมกัน (score รวม = Σ projectScores)', () => {
    // u1/p1: dept2×15 + done1×10 + onTime50×0.5 + wd8 − overdue0×8 = 30+10+25+8 = 73
    // u1/p2: dept1×15 + done0 + onTime0 + wd2 − overdue1×8 = 15+2−8 = 9
    const p1 = s1.projectScores.find((p) => p.projectId === 'p1')!
    const p2 = s1.projectScores.find((p) => p.projectId === 'p2')!
    expect(p1.score).toBe(73)
    expect(p2.score).toBe(9)
    expect(s1.score).toBe(73 + 9) // 82 = ผลบวก
    // u2/p1: dept2×15 + done1×10 + onTime100×0.5 + wd4 = 94 ; u2/p3(ไม่มี task): dept3×15 = 45
    expect(s2.score).toBe(94 + 45) // 139
    expect(s2.score).toBe(s2.projectScores.reduce((a, b) => a + b.score, 0))
  })
  it('projectScore: department เป็นน้ำหนักสูงสุด + หัก overdue', () => {
    // overdue ทำให้คะแนนโปรเจกต์ต่ำกว่า
    const clean = projectScore({ deptCount: 2, taskDone: 2, onTimeRate: 100, workingDays: 5, overdue: 0 })
    const late = projectScore({ deptCount: 2, taskDone: 2, onTimeRate: 100, workingDays: 5, overdue: 2 })
    expect(clean).toBeGreaterThan(late)
    // +1 dept (×15) ถ่วงหนักกว่า +1 งานที่ปิด (×10)
    const moreDept = projectScore({ deptCount: 3, taskDone: 2, onTimeRate: 100, workingDays: 5, overdue: 0 })
    const moreDone = projectScore({ deptCount: 2, taskDone: 3, onTimeRate: 100, workingDays: 5, overdue: 0 })
    expect(moreDept).toBeGreaterThan(moreDone)
  })
  it('competition ranking: คะแนนเท่ากันได้อันดับเท่ากัน', () => {
    const tie = computePerformance(
      [u('a'), u('b'), u('c')],
      [
        task('a', 'p', 'Done', 'done', 3),
        task('b', 'p', 'Done', 'done', 3),
        task('c', 'p', 'To Do', 'overdue', 1),
      ],
      [],
    )
    // a และ b คะแนนเท่ากัน → อันดับ 1 ทั้งคู่, คนถัดไปเป็นอันดับ 3
    const ranks = tie.map((s) => s.rank).sort((x, y) => x - y)
    expect(ranks).toEqual([1, 1, 3])
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
