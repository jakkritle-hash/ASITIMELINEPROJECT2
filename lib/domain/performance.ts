import type { User, SlaStatus } from './types'

export interface PerfTask {
  assigneeId: string
  projectId: string
  columnStatus: string
  slaStatus: SlaStatus
  workingDays: number
  /** วันทำการที่ล่าช้าของงานนี้ (ปิดช้า หรือยังไม่ปิดแต่เลยกำหนด) — 0 ถ้าตรงเวลา */
  lateDays: number
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
  /** ผลรวมวันทำการที่ล่าช้าในโปรเจกต์นี้ (ใช้คิด penalty แบบไล่ตามวัน) */
  lateDays: number
  workingDays: number
  /** อัตราส่ง "ตรงเวลา" ในโปรเจกต์นี้ (งานที่ปิดและไม่ล่าช้า / งานที่รับ) 0–100 */
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

export interface Weights {
  departmentLoad: number
  taskDone: number
  onTimeRate: number
  workingDays: number
  overdue: number
}

/** น้ำหนักคะแนนตั้งต้น — ปรับ runtime ได้ในหน้า Control Data (เก็บใน Config tab) */
export const WEIGHTS: Weights = {
  departmentLoad: 15, // ← น้ำหนักสูงสุด: จำนวน Department ที่โปรเจกต์นี้ใช้
  taskDone: 10, // งานที่ปิดจบจริง
  onTimeRate: 0.5, // อัตราตรงเวลาในโปรเจกต์นี้ (ความน่าเชื่อถือ)
  workingDays: 1, // วันทำการที่ลงแรงในโปรเจกต์นี้
  overdue: -8, // penalty ต่อ 1 "วันทำการที่ล่าช้า" (ยิ่งช้ายิ่งหักมาก)
}

/**
 * คะแนนของ "หนึ่งโปรเจกต์" ที่บุคคลรับ:
 *   projectScore = deptCount×15 + taskDone×10 + onTimeRate×0.5 + workingDays×1 − lateDays×8
 *
 * lateDays = ผลรวม "วันทำการที่ล่าช้า" (ปิดช้า/ยังไม่ปิดแต่เลยกำหนด) — หักตามจำนวนวันจริง
 * คะแนนรวมของบุคคล = ผลบวกของ projectScore ทุกโปรเจกต์ที่เขาเกี่ยวข้อง
 */
export function projectScore(p: Pick<ProjectScore, 'deptCount' | 'taskDone' | 'onTimeRate' | 'workingDays' | 'lateDays'>, w: Weights = WEIGHTS): number {
  return Math.round(
    p.deptCount * w.departmentLoad +
      p.taskDone * w.taskDone +
      p.onTimeRate * w.onTimeRate +
      p.workingDays * w.workingDays +
      p.lateDays * w.overdue,
  )
}

/** สรุปผลงานรายบุคคล — คิดคะแนนแยกทีละโปรเจกต์แล้วรวมกัน (น้ำหนักปรับได้จาก Control Data) */
export function computePerformance(users: User[], tasks: PerfTask[], projects: PerfProject[], weights: Weights = WEIGHTS): MemberStats[] {
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
        // ตรงเวลา = ปิดงานแล้วและไม่ล่าช้า ; lateDays = ผลรวมวันที่ล่าช้าของทุกงาน
        const onTimeDone = inProj.filter((t) => t.columnStatus.toLowerCase() === 'done' && t.lateDays === 0).length
        const lateDays = inProj.reduce((s, t) => s + t.lateDays, 0)
        const workingDays = inProj.reduce((s, t) => s + t.workingDays, 0)
        const onTimeRate = inProj.length ? Math.round((onTimeDone / inProj.length) * 100) : 0
        return { projectId: pid, deptCount, taskTotal: inProj.length, taskDone, lateDays, workingDays, onTimeRate, score: projectScore({ deptCount, taskDone, onTimeRate, workingDays, lateDays }, weights) }
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
