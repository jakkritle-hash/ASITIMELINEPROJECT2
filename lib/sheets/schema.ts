import type { User, Team, Project, Task, ActivityLogEntry, Role, SlaStatus } from '@/lib/domain/types'

export const TAB_HEADERS = {
  Users: ['id', 'email', 'name', 'role', 'avatarColor', 'active', 'createdAt', 'pageDenied'],
  Teams: ['id', 'name', 'memberIds', 'leadUserId', 'createdAt'],
  Projects: ['id', 'name', 'teamId', 'memberIds', 'ownerUserId', 'startDate', 'dueDate', 'status', 'description', 'kanbanColumns', 'createdAt', 'updatedAt', 'archived', 'departments'],
  Tasks: ['id', 'projectId', 'title', 'assigneeId', 'columnStatus', 'startDate', 'dueDate', 'slaStatus', 'editCount', 'description', 'order', 'createdAt', 'updatedAt'],
  ActivityLog: ['id', 'timestamp', 'actorId', 'entityType', 'entityId', 'action', 'field', 'oldValue', 'newValue'],
  Config: ['key', 'value'],
} as const

export type TabName = keyof typeof TAB_HEADERS

const csvToArr = (s: string): string[] => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [])
const arrToCsv = (a: string[] = []): string => a.join(',')
const toBool = (s: string): boolean => s === 'true' || s === 'TRUE'

export function parseUser(r: Record<string, string>): User {
  return { id: r.id, email: r.email, name: r.name, role: (r.role as Role) || 'Member', avatarColor: r.avatarColor || '#94a3b8', active: toBool(r.active), createdAt: r.createdAt, pageDenied: csvToArr(r.pageDenied) }
}
export function parseTeam(r: Record<string, string>): Team {
  return { id: r.id, name: r.name, memberIds: csvToArr(r.memberIds), leadUserId: r.leadUserId || '', createdAt: r.createdAt }
}
export function parseProject(r: Record<string, string>): Project {
  return {
    id: r.id, name: r.name, teamId: r.teamId, memberIds: csvToArr(r.memberIds), ownerUserId: r.ownerUserId,
    startDate: r.startDate, dueDate: r.dueDate, status: (r.status as SlaStatus) || 'on-track', description: r.description || '',
    kanbanColumns: csvToArr(r.kanbanColumns), departments: csvToArr(r.departments), archived: toBool(r.archived), createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}
export function parseTask(r: Record<string, string>): Task {
  return {
    id: r.id, projectId: r.projectId, title: r.title, assigneeId: r.assigneeId, columnStatus: r.columnStatus,
    startDate: r.startDate, dueDate: r.dueDate, slaStatus: (r.slaStatus as SlaStatus) || 'on-track',
    editCount: Number(r.editCount) || 0, description: r.description || '', order: Number(r.order) || 0,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
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
  return { ...u, active: String(u.active), pageDenied: arrToCsv(u.pageDenied) }
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
