import { format } from 'date-fns'
import { getDashboardData, type EnrichedProject } from './dashboard'
import { getAdminData } from './admin'
import { getAppConfig } from './config'
import { computePerformance, type MemberStats } from '@/lib/domain/performance'
import { lateWorkingDays } from '@/lib/domain/workingDays'
import type { User, ProjectKind } from '@/lib/domain/types'
import type { Weights } from '@/lib/domain/performance'

export interface PerformanceData {
  /** อันดับแยกตามประเภทโปรเจกต์ — คิดคะแนนด้วยน้ำหนักของประเภทนั้นๆ */
  main: MemberStats[]
  expand: MemberStats[]
  maintenance: MemberStats[]
  revise: MemberStats[]
  projectNames: Record<string, string>
}

/** จัดอันดับผลงานของประเภทโปรเจกต์หนึ่งๆ ด้วยน้ำหนักของประเภทนั้น */
function rankByKind(
  users: User[],
  projects: EnrichedProject[],
  kind: ProjectKind,
  weights: Weights,
  today: string,
  holidays: string[],
): MemberStats[] {
  const scoped = projects.filter((p) => p.kind === kind)
  const tasks = scoped.flatMap((p) =>
    p.tasks.map((t) => {
      const isDone = t.columnStatus.toLowerCase() === 'done'
      // ปิดแล้ว → เทียบวันปิด (completedAt) ; ยังไม่ปิด → เทียบวันนี้ (เลย due แล้วยิ่งดองยิ่งช้า)
      const ref = isDone ? t.completedAt || '' : today
      return {
        assigneeId: t.assigneeId,
        projectId: p.id,
        columnStatus: t.columnStatus,
        slaStatus: t.slaStatus,
        workingDays: t.workingDays,
        // โปรเจกต์ที่ปิดการคิด Overdue (Control Data) → ไม่หักความล่าช้าเลย
        lateDays: p.overduePenalty === false ? 0 : lateWorkingDays(t.dueDate, ref, holidays),
      }
    }),
  )
  const perfProjects = scoped.map((p) => ({ id: p.id, memberIds: p.memberIds, ownerUserId: p.ownerUserId, departments: p.departments }))
  return computePerformance(users, tasks, perfProjects, weights).filter((s) => s.taskTotal > 0 || s.projectCount > 0)
}

/** สรุปผลงานรายบุคคล แยก Main / Expand / Maintenance (แต่ละชุดใช้น้ำหนักของตัวเอง) */
export async function getPerformance(now: Date = new Date()): Promise<PerformanceData> {
  const [data, admin, config] = await Promise.all([getDashboardData(now), getAdminData(), getAppConfig()])
  const activeUsers = admin.users.filter((u) => u.active) // คน Inactive ไม่จัดอันดับ
  const projectNames = Object.fromEntries(data.projects.map((p) => [p.id, p.name]))
  const today = format(now, 'yyyy-MM-dd')
  const holidays = config.holidays
  return {
    main: rankByKind(activeUsers, data.projects, 'main', config.weights, today, holidays),
    expand: rankByKind(activeUsers, data.projects, 'expand', config.weightsExpand, today, holidays),
    maintenance: rankByKind(activeUsers, data.projects, 'maintenance', config.weightsMaintenance, today, holidays),
    revise: rankByKind(activeUsers, data.projects, 'revise', config.weightsRevise, today, holidays),
    projectNames,
  }
}
