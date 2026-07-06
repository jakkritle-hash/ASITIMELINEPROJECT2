'use server'

import { revalidatePath } from 'next/cache'
import type { Project, ProjectKind } from '@/lib/domain/types'
import { toProjectKind } from '@/lib/domain/types'
import { getTab, appendRow, appendRows, updateRowById, deleteRowById, invalidateSheetCache } from '@/lib/sheets/repository'
import { serializeProject, serializeLog, parseProject, parseTask, parseTeam, TAB_HEADERS } from '@/lib/sheets/schema'
import { canEditProject } from '@/lib/domain/permissions'
import { sanitizeDepartments } from '@/lib/domain/departments'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'
import { getAppConfig } from '@/lib/data/config'

const P_HEADER = TAB_HEADERS.Projects as unknown as string[]
const LOG_HEADER = TAB_HEADERS.ActivityLog as unknown as string[]

/** เขียน Activity Log ของโปรเจกต์ (เช่น rename / เปลี่ยนวัน) */
async function logProject(projectId: string, actorId: string, field: string, oldValue: string, newValue: string, now: string) {
  await appendRows('ActivityLog', [serializeLog({
    id: `${projectId}-${now}-${field}`, timestamp: now, actorId,
    entityType: 'project', entityId: projectId, action: 'update', field, oldValue, newValue,
  })], LOG_HEADER)
}

export interface NewProjectInput {
  name: string
  startDate: string
  dueDate: string
  teamId?: string
  memberIds?: string[]
  description?: string
  departments?: string[]
  kind?: ProjectKind
}

export interface CreateResult {
  ok: boolean
  id?: string
  error?: string
}

/** สมาชิกโปรเจกต์จากทีม: รวมสมาชิกทีม + เจ้าของ (ถ้าไม่มีทีม → เจ้าของคนเดียว) */
async function membersFromTeam(teamId: string, ownerId: string): Promise<string[]> {
  if (!teamId) return [ownerId]
  const team = (await getTab('Teams')).map(parseTeam).find((t) => t.id === teamId)
  if (!team) return [ownerId]
  return Array.from(new Set([...team.memberIds, ownerId]))
}

/** สร้างโปรเจกต์ใหม่ — ผู้ใช้ที่ล็อกอินสร้างของตัวเองได้ (requirement: สร้าง Project ของตัวเองได้) */
export async function createProjectAction(input: NewProjectInput): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true, id: 'dev' }
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!input.name.trim()) return { ok: false, error: 'ต้องมีชื่อโปรเจกต์' }

  const [existing, config] = await Promise.all([getTab('Projects'), getAppConfig()])
  const now = new Date().toISOString()
  const id = `p${existing.length + 1}-${Date.now()}`
  // เลือกทีม → ดึงสมาชิกทีมเข้าโปรเจกต์อัตโนมัติ (ทีมแสดง/แก้ได้ภายหลังบนหน้าโปรเจกต์)
  const members =
    input.memberIds && input.memberIds.length > 0
      ? input.memberIds
      : await membersFromTeam(input.teamId || '', user.id)

  const project: Project = {
    id,
    name: input.name.trim(),
    teamId: input.teamId || '',
    memberIds: members,
    ownerUserId: user.id,
    startDate: input.startDate,
    dueDate: input.dueDate,
    status: 'on-track',
    description: input.description || '',
    kanbanColumns: config.kanbanColumns,
    departments: sanitizeDepartments(input.departments || [], config.departments),
    kind: toProjectKind(input.kind),
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  await appendRow('Projects', serializeProject(project), P_HEADER)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true, id }
}

async function loadProjectForEdit(projectId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'unauthenticated' as const }
  const [projects, teams] = await Promise.all([
    getTab('Projects').then((r) => r.map(parseProject)),
    getTab('Teams').then((r) => r.map(parseTeam)),
  ])
  const project = projects.find((p) => p.id === projectId)
  if (!project) return { error: 'not found' as const }
  const leadTeamIds = teams.filter((t) => t.leadUserId === user.id).map((t) => t.id)
  if (!canEditProject(user, project, leadTeamIds)) return { error: 'forbidden' as const }
  return { project, user }
}

/** เก็บถาวร/เลิกเก็บถาวรโปรเจกต์ (ซ่อน/แสดงใน Dashboard) */
export async function setProjectArchivedAction(projectId: string, archived: boolean): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  const ctx = await loadProjectForEdit(projectId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const updated: Project = { ...ctx.project, archived, updatedAt: new Date().toISOString() }
  await updateRowById('Projects', projectId, serializeProject(updated), P_HEADER)
  revalidatePath('/')
  revalidatePath(`/projects/${projectId}`)
  invalidateSheetCache()
  return { ok: true }
}

/** ปรับ Department ที่ใช้โปรเจกต์นี้ — เพิ่ม/ลบได้ทุกเมื่อ (requirement) */
export async function setProjectDepartmentsAction(projectId: string, departments: string[]): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  const ctx = await loadProjectForEdit(projectId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const { departments: allowed } = await getAppConfig()
  const updated: Project = { ...ctx.project, departments: sanitizeDepartments(departments, allowed), updatedAt: new Date().toISOString() }
  await updateRowById('Projects', projectId, serializeProject(updated), P_HEADER)
  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath(`/projects/${projectId}`)
  invalidateSheetCache()
  return { ok: true }
}

/** เปลี่ยนทีมของโปรเจกต์ — sync สมาชิกทีมใหม่เข้าโปรเจกต์ (requirement: Edit เปลี่ยน Team ได้) */
export async function setProjectTeamAction(projectId: string, teamId: string): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  const ctx = await loadProjectForEdit(projectId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  // เปลี่ยนทีม → สมาชิกโปรเจกต์ตามทีมใหม่ + เจ้าของ; เลือก "ไม่ระบุ" → คงสมาชิกเดิมไว้
  const memberIds = teamId ? await membersFromTeam(teamId, ctx.project.ownerUserId) : ctx.project.memberIds
  const updated: Project = { ...ctx.project, teamId, memberIds, updatedAt: new Date().toISOString() }
  await updateRowById('Projects', projectId, serializeProject(updated), P_HEADER)
  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath(`/projects/${projectId}`)
  invalidateSheetCache()
  return { ok: true }
}

/** เปลี่ยนชื่อโปรเจกต์ได้ทุกเมื่อ — ผู้แก้โปรเจกต์ได้ (เจ้าของ/สมาชิก/หัวหน้าทีม/Admin) + บันทึก log */
export async function renameProjectAction(projectId: string, name: string): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  const clean = name.trim()
  if (!clean) return { ok: false, error: 'ต้องมีชื่อโปรเจกต์' }
  const ctx = await loadProjectForEdit(projectId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  if (clean === ctx.project.name) return { ok: true }
  const now = new Date().toISOString()
  const updated: Project = { ...ctx.project, name: clean, updatedAt: now }
  await updateRowById('Projects', projectId, serializeProject(updated), P_HEADER)
  await logProject(projectId, ctx.user.id, 'name', ctx.project.name, clean, now)
  revalidatePath('/')
  revalidatePath(`/projects/${projectId}`)
  invalidateSheetCache()
  return { ok: true }
}

/** ยืด/ขยาย Timeline (วันเริ่ม–วันครบกำหนด) ได้ทุกเมื่อ — ผู้แก้โปรเจกต์ได้ + บันทึก log */
export async function setProjectDatesAction(projectId: string, startDate: string, dueDate: string): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  if (!startDate || !dueDate) return { ok: false, error: 'ต้องระบุวันเริ่มและวันครบกำหนด' }
  if (dueDate < startDate) return { ok: false, error: 'วันครบกำหนดต้องไม่ก่อนวันเริ่ม' }
  const ctx = await loadProjectForEdit(projectId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  const now = new Date().toISOString()
  const updated: Project = { ...ctx.project, startDate, dueDate, updatedAt: now }
  await updateRowById('Projects', projectId, serializeProject(updated), P_HEADER)
  if (ctx.project.startDate !== startDate) await logProject(projectId, ctx.user.id, 'startDate', ctx.project.startDate, startDate, now)
  if (ctx.project.dueDate !== dueDate) await logProject(projectId, ctx.user.id, 'dueDate', ctx.project.dueDate, dueDate, now)
  revalidatePath('/')
  revalidatePath(`/projects/${projectId}`)
  invalidateSheetCache()
  return { ok: true }
}

/** สลับประเภทโปรเจกต์ Main/Expand — Admin หรือ Owner เท่านั้น (ต่างจาก canEditProject
 *  ที่รวมสมาชิก/หัวหน้าทีมด้วย; ที่นี่จงใจจำกัดแค่ผู้ดูแลกับเจ้าของ เพราะกระทบการคิดคะแนน) */
export async function setProjectKindAction(projectId: string, kind: ProjectKind): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const project = (await getTab('Projects')).map(parseProject).find((p) => p.id === projectId)
  if (!project) return { ok: false, error: 'not found' }
  if (user.role !== 'Admin' && project.ownerUserId !== user.id) {
    return { ok: false, error: 'เฉพาะ Admin หรือเจ้าของโปรเจกต์เท่านั้น' }
  }
  const updated: Project = { ...project, kind: toProjectKind(kind), updatedAt: new Date().toISOString() }
  await updateRowById('Projects', projectId, serializeProject(updated), P_HEADER)
  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath(`/projects/${projectId}`)
  invalidateSheetCache()
  return { ok: true }
}

/** ลบโปรเจกต์ + task ทั้งหมดในโปรเจกต์นั้น (ใช้กรณีสร้างผิด/ยกเลิก) */
export async function deleteProjectAction(projectId: string): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true }
  const ctx = await loadProjectForEdit(projectId)
  if ('error' in ctx) return { ok: false, error: ctx.error }
  // ลบ task ของโปรเจกต์ก่อน (อ่านสดทุกครั้งเพื่อ index ถูกต้อง)
  const taskIds = (await getTab('Tasks')).map(parseTask).filter((t) => t.projectId === projectId).map((t) => t.id)
  for (const tid of taskIds) await deleteRowById('Tasks', tid)
  await deleteRowById('Projects', projectId)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true }
}
