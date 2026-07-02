import type { User, SlaStatus } from './types'

export interface PerfTask {
  assigneeId: string
  projectId: string
  columnStatus: string
  slaStatus: SlaStatus
  workingDays: number
}
export interface PerfProject {
  id: string
  memberIds: string[]
  ownerUserId: string
  departments: string[]
}
export interface MemberStats {
  user: User
  projectCount: number
  projectIds: string[]
  taskTotal: number
  taskDone: number
  workingDays: number
  completion: number
  byStatus: Record<SlaStatus, number>
  /** ผลรวม "จำนวน Department ที่ใช้" ของทุกโปรเจกต์ที่คนนี้เกี่ยวข้อง (ยิ่งข้ามแผนกมาก ยิ่งสูง) */
  departmentLoad: number
  score: number
  /** อันดับ (1 = แชมป์) แบบ competition ranking: คะแนนเท่ากันได้อันดับเท่ากัน */
  rank: number
}

/** น้ำหนักคะแนน — ปรับได้ที่นี่ที่เดียว (Department = สูงสุดตามที่ผู้ใช้กำหนด) */
export const WEIGHTS = {
  departmentLoad: 15, // ← น้ำหนักสูงสุด: ทำงานข้ามหลายแผนก = ผลกระทบกว้าง
  taskDone: 10, // งานที่ปิดจบจริง
  completion: 0.5, // อัตราส่งสำเร็จ % (ความน่าเชื่อถือ)
  workingDays: 1, // วันทำการที่ลงแรง
  overdue: -8, // penalty งานเลยกำหนด
} as const

/**
 * คะแนนจัดอันดับผลงาน — นิยาม "แชมป์" ของทีม
 *
 * score = departmentLoad×15 + taskDone×10 + completion×0.5 + workingDays×1 − overdue×8
 *
 * ตรรกะ: การทำงานข้ามหลายแผนก (department load) มีน้ำหนักสูงสุด รองมาคือปิดงานได้จริง
 * + ตรงเวลา — "รับงานเยอะ" ดิบๆ ไม่ใช่แชมป์
 */
export function rankScore(s: Pick<MemberStats, 'departmentLoad' | 'taskDone' | 'completion' | 'workingDays' | 'byStatus'>): number {
  return Math.round(
    s.departmentLoad * WEIGHTS.departmentLoad +
      s.taskDone * WEIGHTS.taskDone +
      s.completion * WEIGHTS.completion +
      s.workingDays * WEIGHTS.workingDays +
      s.byStatus.overdue * WEIGHTS.overdue,
  )
}

/** สรุปผลงานรายบุคคลจากงานที่รับ (assignee) + โปรเจกต์ที่เกี่ยวข้อง */
export function computePerformance(users: User[], tasks: PerfTask[], projects: PerfProject[]): MemberStats[] {
  const deptCountById = new Map(projects.map((p) => [p.id, p.departments.length]))
  const stats = users
    .map((u): MemberStats => {
      const mine = tasks.filter((t) => t.assigneeId === u.id)
      const projIds = new Set<string>()
      mine.forEach((t) => projIds.add(t.projectId))
      projects.forEach((p) => {
        if (p.ownerUserId === u.id || p.memberIds.includes(u.id)) projIds.add(p.id)
      })
      const byStatus: Record<SlaStatus, number> = { 'on-track': 0, 'at-risk': 0, overdue: 0, done: 0 }
      mine.forEach((t) => {
        byStatus[t.slaStatus] = (byStatus[t.slaStatus] ?? 0) + 1
      })
      const taskDone = mine.filter((t) => t.columnStatus.toLowerCase() === 'done').length
      const workingDays = mine.reduce((s, t) => s + t.workingDays, 0)
      const completion = mine.length ? Math.round((taskDone / mine.length) * 100) : 0
      // จำนวน Department ที่ใช้ของแต่ละโปรเจกต์ที่เกี่ยวข้อง แล้วรวมกัน
      const departmentLoad = [...projIds].reduce((s, id) => s + (deptCountById.get(id) ?? 0), 0)
      const base = { departmentLoad, taskDone, completion, workingDays, byStatus }
      return {
        user: u,
        projectCount: projIds.size,
        projectIds: [...projIds],
        taskTotal: mine.length,
        taskDone,
        workingDays,
        completion,
        byStatus,
        departmentLoad,
        score: rankScore(base),
        rank: 0, // กำหนดหลังเรียง
      }
    })
    .sort((a, b) => b.score - a.score || b.taskDone - a.taskDone || b.taskTotal - a.taskTotal)

  // competition ranking: คะแนนเท่ากัน = อันดับเท่ากัน, อันดับถัดไปข้ามตามจำนวนที่เสมอ
  let lastScore: number | null = null
  let lastRank = 0
  stats.forEach((s, i) => {
    if (s.score !== lastScore) {
      lastRank = i + 1
      lastScore = s.score
    }
    s.rank = lastRank
  })
  return stats
}
