'use server'

import { revalidatePath } from 'next/cache'
import type { Project } from '@/lib/domain/types'
import { getTab, appendRow, updateRowById, deleteRowById, invalidateSheetCache } from '@/lib/sheets/repository'
import { serializeProject, parseProject, parseTask, parseTeam, TAB_HEADERS } from '@/lib/sheets/schema'
import { canEditProject } from '@/lib/domain/permissions'
import { sanitizeDepartments } from '@/lib/domain/departments'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'

const P_HEADER = TAB_HEADERS.Projects as unknown as string[]
const DEFAULT_COLUMNS = ['Pending', 'To Do', 'In Progress', 'Review', 'Done']

export interface NewProjectInput {
  name: string
  startDate: string
  dueDate: string
  teamId?: string
  memberIds?: string[]
  description?: string
  departments?: string[]
}

export interface CreateResult {
  ok: boolean
  id?: string
  error?: string
}

/** สร้างโปรเจกต์ใหม่ — ผู้ใช้ที่ล็อกอินสร้างของตัวเองได้ (requirement: สร้าง Project ของตัวเองได้) */
export async function createProjectAction(input: NewProjectInput): Promise<CreateResult> {
  if (!sheetsConfigured()) return { ok: true, id: 'dev' }
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!input.name.trim()) return { ok: false, error: 'ต้องมีชื่อโปรเจกต์' }

  const existing = await getTab('Projects')
  const now = new Date().toISOString()
  const id = `p${existing.length + 1}-${Date.now()}`
  const members = input.memberIds && input.memberIds.length > 0 ? input.memberIds : [user.id]

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
    kanbanColumns: DEFAULT_COLUMNS,
    departments: sanitizeDepartments(input.departments || []),
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
  const updated: Project = { ...ctx.project, departments: sanitizeDepartments(departments), updatedAt: new Date().toISOString() }
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
