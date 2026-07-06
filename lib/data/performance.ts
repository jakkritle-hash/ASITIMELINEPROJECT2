import { getDashboardData } from './dashboard'
import { getAdminData } from './admin'
import { getAppConfig } from './config'
import { computePerformance, type MemberStats } from '@/lib/domain/performance'

export interface PerformanceData {
  stats: MemberStats[]
  projectNames: Record<string, string>
}

/** สรุปผลงานรายบุคคล (รวมทุกโปรเจกต์ทั้งที่ทำอยู่และเก็บถาวรแล้ว) */
export async function getPerformance(): Promise<PerformanceData> {
  const [data, admin, config] = await Promise.all([getDashboardData(), getAdminData(), getAppConfig()])
  // นับคะแนนเฉพาะโปรเจกต์ประเภท 'main' — 'expand'/'maintenance' ไม่นับทั้งงานและ department load
  const scored = data.projects.filter((p) => p.kind === 'main')
  const tasks = scored.flatMap((p) =>
    p.tasks.map((t) => ({
      assigneeId: t.assigneeId,
      projectId: p.id,
      columnStatus: t.columnStatus,
      slaStatus: t.slaStatus,
      workingDays: t.workingDays,
    })),
  )
  const projects = scored.map((p) => ({ id: p.id, memberIds: p.memberIds, ownerUserId: p.ownerUserId, departments: p.departments }))
  const projectNames = Object.fromEntries(data.projects.map((p) => [p.id, p.name]))
  // จัดอันดับเฉพาะผู้ใช้ที่ยัง active (requirement: คน Inactive ไม่เอามาแสดง)
  const stats = computePerformance(
    admin.users.filter((u) => u.active),
    tasks,
    projects,
    config.weights,
  ).filter((s) => s.taskTotal > 0 || s.projectCount > 0)
  return { stats, projectNames }
}
