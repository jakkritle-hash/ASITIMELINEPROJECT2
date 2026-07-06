import { getDashboardData, type EnrichedProject } from './dashboard'
import { getAdminData } from './admin'
import { getAppConfig } from './config'
import { computePerformance, type MemberStats } from '@/lib/domain/performance'
import type { User, ProjectKind } from '@/lib/domain/types'
import type { Weights } from '@/lib/domain/performance'

export interface PerformanceData {
  /** อันดับแยกตามประเภทโปรเจกต์ — คิดคะแนนด้วยน้ำหนักของประเภทนั้นๆ */
  main: MemberStats[]
  expand: MemberStats[]
  maintenance: MemberStats[]
  projectNames: Record<string, string>
}

/** จัดอันดับผลงานของประเภทโปรเจกต์หนึ่งๆ ด้วยน้ำหนักของประเภทนั้น */
function rankByKind(users: User[], projects: EnrichedProject[], kind: ProjectKind, weights: Weights): MemberStats[] {
  const scoped = projects.filter((p) => p.kind === kind)
  const tasks = scoped.flatMap((p) =>
    p.tasks.map((t) => ({
      assigneeId: t.assigneeId,
      projectId: p.id,
      columnStatus: t.columnStatus,
      slaStatus: t.slaStatus,
      workingDays: t.workingDays,
    })),
  )
  const perfProjects = scoped.map((p) => ({ id: p.id, memberIds: p.memberIds, ownerUserId: p.ownerUserId, departments: p.departments }))
  return computePerformance(users, tasks, perfProjects, weights).filter((s) => s.taskTotal > 0 || s.projectCount > 0)
}

/** สรุปผลงานรายบุคคล แยก Main / Expand / Maintenance (แต่ละชุดใช้น้ำหนักของตัวเอง) */
export async function getPerformance(): Promise<PerformanceData> {
  const [data, admin, config] = await Promise.all([getDashboardData(), getAdminData(), getAppConfig()])
  const activeUsers = admin.users.filter((u) => u.active) // คน Inactive ไม่จัดอันดับ
  const projectNames = Object.fromEntries(data.projects.map((p) => [p.id, p.name]))
  return {
    main: rankByKind(activeUsers, data.projects, 'main', config.weights),
    expand: rankByKind(activeUsers, data.projects, 'expand', config.weightsExpand),
    maintenance: rankByKind(activeUsers, data.projects, 'maintenance', config.weightsMaintenance),
    projectNames,
  }
}
