export type Role = 'Admin' | 'Manager' | 'Member'
export type SlaStatus = 'on-track' | 'at-risk' | 'overdue' | 'done'
/** ประเภทโปรเจกต์ — แต่ละประเภทจัดอันดับ Performance แยกกันด้วยน้ำหนักของตัวเอง */
export type ProjectKind = 'main' | 'expand' | 'maintenance' | 'revise'
export const PROJECT_KINDS: ProjectKind[] = ['main', 'expand', 'maintenance', 'revise']
/** normalize ค่าที่รับมา → ProjectKind ที่ถูกต้อง (default 'main') */
export function toProjectKind(v: unknown): ProjectKind {
  return v === 'expand' || v === 'maintenance' || v === 'revise' ? v : 'main'
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatarColor: string
  active: boolean
  createdAt: string
  /**
   * รายการคีย์หน้าที่ผู้ใช้คนนี้ "เข้าถึงได้" (allow-list)
   * - ว่าง = ใช้ค่าเริ่มต้น (เห็นเฉพาะหน้าเนื้อหา: dashboard, performance)
   * - ['__none__'] = ปิดทุกหน้า
   * - Admin เห็นทุกหน้าเสมอโดยไม่สนค่านี้
   */
  pageAccess: string[]
  /** presence: เวลาล่าสุดที่ heartbeat (ISO) และเวลาล่าสุดที่ tab กำลัง active/ดูอยู่ */
  lastSeenAt?: string
  lastActiveAt?: string
}

export interface Team {
  id: string
  name: string
  memberIds: string[]
  leadUserId: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  teamId: string
  memberIds: string[]
  ownerUserId: string
  startDate: string // ISO date (YYYY-MM-DD)
  dueDate: string
  status: SlaStatus
  description: string
  kanbanColumns: string[]
  departments: string[]
  /** 'main' = นับคะแนน Performance, 'expand' = ไม่นับ */
  kind: ProjectKind
  /** ลำดับการแสดงบน Timeline (น้อย = อยู่บน) — ลากจัดเรียงได้ */
  order?: number
  /** false = ไม่หักคะแนนความล่าช้า (Overdue) ของโปรเจกต์นี้ — ปรับได้ที่ Control Data (default true) */
  overduePenalty?: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  assigneeId: string
  columnStatus: string
  startDate: string
  dueDate: string
  slaStatus: SlaStatus
  editCount: number
  description: string
  order: number
  createdAt: string
  updatedAt: string
  /** วันที่ปิดงาน (YYYY-MM-DD) — บันทึกตอนย้ายเข้าคอลัมน์ Done; ใช้คิด "ล่าช้ากี่วัน" */
  completedAt?: string
}

export type LogAction = 'create' | 'update' | 'move' | 'delete'

export interface ActivityLogEntry {
  id: string
  timestamp: string
  actorId: string
  entityType: 'project' | 'task'
  entityId: string
  action: LogAction
  field: string
  oldValue: string
  newValue: string
}
