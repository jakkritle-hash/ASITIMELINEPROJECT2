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
}

/** สรุปผลงานรายบุคคลจากงานที่รับ (assignee) + โปรเจกต์ที่เกี่ยวข้อง */
export function computePerformance(users: User[], tasks: PerfTask[], projects: PerfProject[]): MemberStats[] {
  return users
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
      return {
        user: u,
        projectCount: projIds.size,
        projectIds: [...projIds],
        taskTotal: mine.length,
        taskDone,
        workingDays,
        completion: mine.length ? Math.round((taskDone / mine.length) * 100) : 0,
        byStatus,
      }
    })
    .sort((a, b) => b.taskTotal - a.taskTotal)
}
