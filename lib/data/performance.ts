import { getDashboardData } from './dashboard'
import { getAdminData } from './admin'
import { computePerformance, type MemberStats } from '@/lib/domain/performance'

export interface PerformanceData {
  stats: MemberStats[]
  projectNames: Record<string, string>
}

/** สรุปผลงานรายบุคคล (รวมทุกโปรเจกต์ทั้งที่ทำอยู่และเก็บถาวรแล้ว) */
export async function getPerformance(): Promise<PerformanceData> {
  const [data, admin] = await Promise.all([getDashboardData(), getAdminData()])
  const tasks = data.projects.flatMap((p) =>
    p.tasks.map((t) => ({
      assigneeId: t.assigneeId,
      projectId: p.id,
      columnStatus: t.columnStatus,
      slaStatus: t.slaStatus,
      workingDays: t.workingDays,
    })),
  )
  const projects = data.projects.map((p) => ({ id: p.id, memberIds: p.memberIds, ownerUserId: p.ownerUserId, departments: p.departments }))
  const projectNames = Object.fromEntries(data.projects.map((p) => [p.id, p.name]))
  const stats = computePerformance(admin.users, tasks, projects).filter((s) => s.taskTotal > 0 || s.projectCount > 0)
  return { stats, projectNames }
}
