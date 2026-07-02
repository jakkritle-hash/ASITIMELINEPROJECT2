import type { User, Project, Task } from './types'
import { PAGES, CONTENT_PAGES } from './pages'

/** Admin แก้ได้ทุกอย่าง; Manager แก้ได้ถ้าโปรเจกต์อยู่ในทีมที่ตนเป็นหัวหน้า; Member แก้ได้ถ้าเป็นเจ้าของหรือสมาชิกโปรเจกต์ */
export function canEditProject(user: User, project: Project, leadTeamIds: string[] = []): boolean {
  if (user.role === 'Admin') return true
  if (user.role === 'Manager' && leadTeamIds.includes(project.teamId)) return true
  return project.ownerUserId === user.id || project.memberIds.includes(user.id)
}

/** เฉพาะ Admin จัดการผู้ใช้/บทบาท */
export function canManageMembers(user: User): boolean {
  return user.role === 'Admin'
}

/**
 * เข้าถึงหน้านี้ได้ไหม
 * - Admin: เข้าได้ทุกหน้าเสมอ
 * - หน้า admin (members/teams/control): เฉพาะ Admin
 * - หน้าเนื้อหา (dashboard/performance): เข้าได้ ยกเว้นถูก "ปิดสิทธิ์" (pageDenied)
 */
export function canAccessPage(user: User, pageKey: string): boolean {
  const page = PAGES.find((p) => p.key === pageKey)
  if (!page) return false
  if (user.role === 'Admin') return true
  if (page.admin) return false
  return !user.pageDenied.includes(pageKey)
}

/** คีย์หน้าที่ผู้ใช้เข้าถึงได้ (ใช้ซ่อนเมนู + หา fallback) */
export function accessiblePageKeys(user: User): string[] {
  return PAGES.filter((p) => canAccessPage(user, p.key)).map((p) => p.key)
}

/** หน้าเนื้อหาที่ toggle ได้ — ค่าที่อนุญาต (ตรงข้ามกับ pageDenied) */
export function allowedContentKeys(user: User): string[] {
  return CONTENT_PAGES.filter((p) => !user.pageDenied.includes(p.key)).map((p) => p.key)
}

/** แก้ task ได้ถ้าแก้โปรเจกต์ได้ หรือเป็นผู้รับผิดชอบ task นั้น */
export function canEditTask(user: User, task: Task, project: Project, leadTeamIds: string[] = []): boolean {
  if (canEditProject(user, project, leadTeamIds)) return true
  return task.assigneeId === user.id
}
