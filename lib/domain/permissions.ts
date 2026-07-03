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

/** sentinel = "ปิดทุกหน้า" (แยกจาก '' ที่แปลว่า 'ใช้ค่าเริ่มต้น') */
export const PAGE_ACCESS_NONE = '__none__'

const PAGE_KEYS = PAGES.map((p) => p.key)
const PAGE_KEY_SET = new Set(PAGE_KEYS)
const CONTENT_KEYS = CONTENT_PAGES.map((p) => p.key)

/**
 * สิทธิ์เห็นหน้าที่มีผลจริง (allow-list) หลังตีความค่าเริ่มต้น/sentinel
 * - ว่าง → ค่าเริ่มต้น = หน้าเนื้อหา (dashboard, performance)
 * - ['__none__'] → ปิดทุกหน้า
 * - อื่นๆ → ตามที่ระบุ
 */
export function effectivePageAccess(user: User): string[] {
  const raw = user.pageAccess
  if (raw.length === 0) return CONTENT_KEYS
  if (raw.length === 1 && raw[0] === PAGE_ACCESS_NONE) return []
  return raw.filter((k) => k !== PAGE_ACCESS_NONE && PAGE_KEY_SET.has(k))
}

/**
 * เข้าถึงหน้านี้ได้ไหม
 * - Admin: เข้าได้ทุกหน้าเสมอ
 * - อื่นๆ: ต้องอยู่ใน allow-list (effectivePageAccess) — ทุกหน้าคุมได้รายบุคคล
 */
export function canAccessPage(user: User, pageKey: string): boolean {
  if (!PAGES.some((p) => p.key === pageKey)) return false
  if (user.role === 'Admin') return true
  return effectivePageAccess(user).includes(pageKey)
}

/** คีย์หน้าที่ผู้ใช้เข้าถึงได้ (ใช้ซ่อนเมนู + หา fallback) */
export function accessiblePageKeys(user: User): string[] {
  return PAGES.filter((p) => canAccessPage(user, p.key)).map((p) => p.key)
}

/** normalize ค่าที่จะบันทึก: ว่าง → sentinel 'ปิดทุกหน้า'; ไม่งั้นตัดซ้ำ */
export function normalizePageAccess(access: string[]): string[] {
  const clean = [...new Set(access.filter((k) => k !== PAGE_ACCESS_NONE && PAGE_KEY_SET.has(k)))]
  return clean.length === 0 ? [PAGE_ACCESS_NONE] : clean
}

/** แก้ task ได้ถ้าแก้โปรเจกต์ได้ หรือเป็นผู้รับผิดชอบ task นั้น */
export function canEditTask(user: User, task: Task, project: Project, leadTeamIds: string[] = []): boolean {
  if (canEditProject(user, project, leadTeamIds)) return true
  return task.assigneeId === user.id
}
