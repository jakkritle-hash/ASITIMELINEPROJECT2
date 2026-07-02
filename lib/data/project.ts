import type { User, ActivityLogEntry } from '@/lib/domain/types'
import { getDashboardData, type EnrichedProject, sheetsConfigured } from './dashboard'
import { getAdminData } from './admin'
import { getTabCached } from '@/lib/sheets/repository'
import { parseLog } from '@/lib/sheets/schema'

export interface ProjectData {
  project: EnrichedProject
  users: User[]
  logs: ActivityLogEntry[]
}

/** ดึงข้อมูลโปรเจกต์เดียว + ผู้ใช้ + Activity Log ของงานในโปรเจกต์นั้น; คืน null ถ้าไม่พบ */
export async function getProjectData(id: string, now: Date = new Date()): Promise<ProjectData | null> {
  const [data, admin] = await Promise.all([getDashboardData(now), getAdminData()])
  const project = data.projects.find((p) => p.id === id)
  if (!project) return null

  let logs: ActivityLogEntry[] = []
  if (sheetsConfigured()) {
    const taskIds = new Set(project.tasks.map((t) => t.id))
    logs = (await getTabCached('ActivityLog'))
      .map(parseLog)
      .filter((l) => taskIds.has(l.entityId) || l.entityId === project.id)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)) // ใหม่→เก่า
  }
  return { project, users: admin.users, logs }
}
