import type { User } from '@/lib/domain/types'
import { getDashboardData, type EnrichedProject } from './dashboard'
import { getAdminData } from './admin'

export interface ProjectData {
  project: EnrichedProject
  users: User[]
}

/** ดึงข้อมูลโปรเจกต์เดียว (พร้อม tasks ที่ enrich แล้ว) + รายชื่อผู้ใช้สำหรับ dropdown; คืน null ถ้าไม่พบ */
export async function getProjectData(id: string, now: Date = new Date()): Promise<ProjectData | null> {
  const [data, admin] = await Promise.all([getDashboardData(now), getAdminData()])
  const project = data.projects.find((p) => p.id === id)
  if (!project) return null
  return { project, users: admin.users }
}
