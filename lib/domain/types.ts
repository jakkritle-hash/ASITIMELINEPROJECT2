export type Role = 'Admin' | 'Manager' | 'Member'
export type SlaStatus = 'on-track' | 'at-risk' | 'overdue' | 'done'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatarColor: string
  active: boolean
  createdAt: string
  /** คีย์ของหน้า (content page) ที่ถูก "ปิดสิทธิ์" ให้ผู้ใช้คนนี้ — ว่าง = เข้าได้ทุกหน้า */
  pageDenied: string[]
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
