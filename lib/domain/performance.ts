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
/** คะแนนของ "หนึ่งโปรเจกต์" ที่คนนี้รับ — บวกกันจึงเป็นคะแนนรวมของบุคคล */
export interface ProjectScore {
  projectId: string
  deptCount: number
  taskTotal: number
  taskDone: number
  overdue: number
  workingDays: number
  /** อัตราส่งตรงเวลาในโปรเจกต์นี้ (งานปิดจบ / งานที่รับในโปรเจกต์) 0–100 */
  onTimeRate: number
  score: number
}

export interface MemberStats {
  user: User
  projectCount: number
  projectIds: string[]
  /** คะแนนแยกรายโปรเจกต์ (score รวม = ผลบวกของ projectScores[].score) */
  projectScores: ProjectScore[]
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
  departmentLoad: 15, // ← น้ำหนักสูงสุด: จำนวน Department ที่โปรเจกต์นี้ใช้
  taskDone: 10, // งานที่ปิดจบจริง (ส่งตรงเวลา)
  onTimeRate: 0.5, // อัตราตรงเวลาในโปรเจกต์นี้ (ความน่าเชื่อถือ)
  workingDays: 1, // วันทำการที่ลงแรงในโปรเจกต์นี้
  overdue: -8, // penalty งานเลยกำหนด
} as const

/**
 * คะแนนของ "หนึ่งโปรเจกต์" ที่บุคคลรับ:
 *   projectScore = deptCount×15 + taskDone×10 + onTimeRate×0.5 + workingDays×1 − overdue×8
 *
 * คะแนนรวมของบุคคล = ผลบวกของ projectScore ทุกโปรเจกต์ที่เขาเกี่ยวข้อง
 * (คิดแยกทีละโปรเจกต์แล้วเอามารวมกัน)
 */
export function projectScore(p: Pick<ProjectScore, 'deptCount' | 'taskDone' | 'onTimeRate' | 'workingDays' | 'overdue'>): number {
  return Math.round(
    p.deptCount * WEIGHTS.departmentLoad +
      p.taskDone * WEIGHTS.taskDone +
      p.onTimeRate * WEIGHTS.onTimeRate +
      p.workingDays * WEIGHTS.workingDays +
      p.overdue * WEIGHTS.overdue,
  )
}

/** สรุปผลงานรายบุคคล — คิดคะแนนแยกทีละโปรเจกต์แล้วรวมกัน */
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

      // ── คิดคะแนนแยกทีละโปรเจกต์ ──
      const projectScores: ProjectScore[] = [...projIds].map((pid) => {
        const inProj = mine.filter((t) => t.projectId === pid)
        const deptCount = deptCountById.get(pid) ?? 0
        const taskDone = inProj.filter((t) => t.columnStatus.toLowerCase() === 'done').length
        const overdue = inProj.filter((t) => t.slaStatus === 'overdue').length
        const workingDays = inProj.reduce((s, t) => s + t.workingDays, 0)
        const onTimeRate = inProj.length ? Math.round((taskDone / inProj.length) * 100) : 0
        return { projectId: pid, deptCount, taskTotal: inProj.length, taskDone, overdue, workingDays, onTimeRate, score: projectScore({ deptCount, taskDone, onTimeRate, workingDays, overdue }) }
      })
      // เรียงโปรเจกต์คะแนนมาก→น้อยเพื่อโชว์
      projectScores.sort((a, b) => b.score - a.score)

      const byStatus: Record<SlaStatus, number> = { 'on-track': 0, 'at-risk': 0, overdue: 0, done: 0 }
      mine.forEach((t) => {
        byStatus[t.slaStatus] = (byStatus[t.slaStatus] ?? 0) + 1
      })
      const taskDone = mine.filter((t) => t.columnStatus.toLowerCase() === 'done').length
      const workingDays = mine.reduce((s, t) => s + t.workingDays, 0)
      const completion = mine.length ? Math.round((taskDone / mine.length) * 100) : 0
      const departmentLoad = projectScores.reduce((s, ps) => s + ps.deptCount, 0)
      // ── คะแนนรวม = ผลบวกของคะแนนรายโปรเจกต์ ──
      const score = projectScores.reduce((s, ps) => s + ps.score, 0)

      return {
        user: u,
        projectCount: projIds.size,
        projectIds: [...projIds],
        projectScores,
        taskTotal: mine.length,
        taskDone,
        workingDays,
        completion,
        byStatus,
        departmentLoad,
        score,
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
