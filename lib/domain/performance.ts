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
  score: number
  /** อันดับ (1 = แชมป์) แบบ competition ranking: คะแนนเท่ากันได้อันดับเท่ากัน */
  rank: number
}

/**
 * คะแนนจัดอันดับผลงาน — นิยาม "แชมป์" ของทีม
 *
 * น้ำหนัก (ปรับได้ที่นี่ที่เดียว):
 *  - งานที่ส่งสำเร็จ (output ที่ปิดจบจริง)   ×10  ← ให้ความสำคัญสูงสุด
 *  - อัตราส่งสำเร็จ % (ความน่าเชื่อถือ)      ×0.5
 *  - วันทำการที่ลงแรงไป (ความทุ่มเท)          ×1
 *  - งานเลยกำหนด (penalty)                    ×-8
 *
 * ตรรกะ: "รับงานเยอะ" ไม่ใช่แชมป์ — "ปิดงานได้จริง + ตรงเวลา" ต่างหากคือแชมป์
 */
export function rankScore(s: Pick<MemberStats, 'taskDone' | 'completion' | 'workingDays' | 'byStatus'>): number {
  return Math.round(s.taskDone * 10 + s.completion * 0.5 + s.workingDays * 1 - s.byStatus.overdue * 8)
}

/** สรุปผลงานรายบุคคลจากงานที่รับ (assignee) + โปรเจกต์ที่เกี่ยวข้อง */
export function computePerformance(users: User[], tasks: PerfTask[], projects: PerfProject[]): MemberStats[] {
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
      const base = { taskDone, completion, workingDays, byStatus }
      return {
        user: u,
        projectCount: projIds.size,
        projectIds: [...projIds],
        taskTotal: mine.length,
        taskDone,
        workingDays,
        completion,
        byStatus,
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
