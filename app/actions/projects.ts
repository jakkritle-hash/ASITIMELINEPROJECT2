'use server'

import { revalidatePath } from 'next/cache'
import type { Project, ProjectKind } from '@/lib/domain/types'
import { getTab, appendRow, updateRowById, deleteRowById, invalidateSheetCache } from '@/lib/sheets/repository'
import { serializeProject, parseProject, parseTask, parseTeam, TAB_HEADERS } from '@/lib/sheets/schema'
import { canEditProject } from '@/lib/domain/permissions'
import { sanitizeDepartments } from '@/lib/domain/departments'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'
import { getAppConfig } from '@/lib/data/config'

const P_HEADER = TAB_HEADERS.Projects as unknown as string[]

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
    kind: input.kind === 'expand' ? 'expand' : 'main',
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
  return { project }
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
  const updated: Project = { ...project, kind: kind === 'expand' ? 'expand' : 'main', updatedAt: new Date().toISOString() }
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
