import type { User, Team, Project, Task, ActivityLogEntry, Role, SlaStatus } from '@/lib/domain/types'
import { toProjectKind } from '@/lib/domain/types'
import { CONTENT_PAGES } from '@/lib/domain/pages'

export const TAB_HEADERS = {
  Users: ['id', 'email', 'name', 'role', 'avatarColor', 'active', 'createdAt', 'pageAccess'],
  Teams: ['id', 'name', 'memberIds', 'leadUserId', 'createdAt'],
  Projects: ['id', 'name', 'teamId', 'memberIds', 'ownerUserId', 'startDate', 'dueDate', 'status', 'description', 'kanbanColumns', 'createdAt', 'updatedAt', 'archived', 'departments', 'kind'],
  Tasks: ['id', 'projectId', 'title', 'assigneeId', 'columnStatus', 'startDate', 'dueDate', 'slaStatus', 'editCount', 'description', 'order', 'createdAt', 'updatedAt', 'completedAt'],
  ActivityLog: ['id', 'timestamp', 'actorId', 'entityType', 'entityId', 'action', 'field', 'oldValue', 'newValue'],
  Config: ['key', 'value'],
} as const

export type TabName = keyof typeof TAB_HEADERS

const csvToArr = (s: string): string[] => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [])
const arrToCsv = (a: string[] = []): string => a.join(',')
const toBool = (s: string): boolean => s === 'true' || s === 'TRUE'
const PAGE_ACCESS_NONE = '__none__'
const CONTENT_KEYS = CONTENT_PAGES.map((p) => p.key)

function parsePageAccess(r: Record<string, string>): string[] {
  if (Object.prototype.hasOwnProperty.call(r, 'pageAccess')) return csvToArr(r.pageAccess)
  const denied = csvToArr(r.pageDenied)
  if (denied.length === 0) return []
  const access = CONTENT_KEYS.filter((k) => !denied.includes(k))
  return access.length === 0 ? [PAGE_ACCESS_NONE] : access
}

export function parseUser(r: Record<string, string>): User {
  return { id: r.id, email: r.email, name: r.name, role: (r.role as Role) || 'Member', avatarColor: r.avatarColor || '#94a3b8', active: toBool(r.active), createdAt: r.createdAt, pageAccess: parsePageAccess(r) }
}
export function parseTeam(r: Record<string, string>): Team {
  return { id: r.id, name: r.name, memberIds: csvToArr(r.memberIds), leadUserId: r.leadUserId || '', createdAt: r.createdAt }
}
export function parseProject(r: Record<string, string>): Project {
  return {
    id: r.id, name: r.name, teamId: r.teamId, memberIds: csvToArr(r.memberIds), ownerUserId: r.ownerUserId,
    startDate: r.startDate, dueDate: r.dueDate, status: (r.status as SlaStatus) || 'on-track', description: r.description || '',
    kanbanColumns: csvToArr(r.kanbanColumns), departments: csvToArr(r.departments),
    kind: toProjectKind(r.kind), // ค่าเดิมที่ไม่มีคอลัมน์ → main
    archived: toBool(r.archived), createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}
export function parseTask(r: Record<string, string>): Task {
  return {
    id: r.id, projectId: r.projectId, title: r.title, assigneeId: r.assigneeId, columnStatus: r.columnStatus,
    startDate: r.startDate, dueDate: r.dueDate, slaStatus: (r.slaStatus as SlaStatus) || 'on-track',
    editCount: Number(r.editCount) || 0, description: r.description || '', order: Number(r.order) || 0,
    createdAt: r.createdAt, updatedAt: r.updatedAt, completedAt: r.completedAt || '',
  }
}

export function parseLog(r: Record<string, string>): ActivityLogEntry {
  return {
    id: r.id, timestamp: r.timestamp, actorId: r.actorId,
    entityType: (r.entityType as ActivityLogEntry['entityType']) || 'task', entityId: r.entityId,
    action: (r.action as ActivityLogEntry['action']) || 'update', field: r.field || '',
    oldValue: r.oldValue || '', newValue: r.newValue || '',
  }
}

export function serializeUser(u: User): Record<string, string> {
  return { ...u, active: String(u.active), pageAccess: arrToCsv(u.pageAccess) }
}
export function serializeTeam(t: Team): Record<string, string> {
  return { ...t, memberIds: arrToCsv(t.memberIds) }
}
export function serializeProject(p: Project): Record<string, string> {
  return { ...p, memberIds: arrToCsv(p.memberIds), kanbanColumns: arrToCsv(p.kanbanColumns), departments: arrToCsv(p.departments), archived: String(p.archived) }
}
export function serializeTask(t: Task): Record<string, string> {
  return { ...t, editCount: String(t.editCount), order: String(t.order) }
}
export function serializeLog(l: ActivityLogEntry): Record<string, string> {
  return { ...l }
}
