'use server'

import { revalidatePath } from 'next/cache'
import type { Task, Project, Team } from '@/lib/domain/types'
import { getTab, updateRowById, appendRows, invalidateSheetCache } from '@/lib/sheets/repository'
import { parseTask, parseProject, parseTeam, serializeTask, serializeLog, TAB_HEADERS } from '@/lib/sheets/schema'
import { applyTaskEdit, makeMoveLog } from '@/lib/domain/activity'
import { computeSlaStatus } from '@/lib/domain/sla'
import { canEditTask, canEditProject } from '@/lib/domain/permissions'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'

const TZ = 'Asia/Bangkok'
const AT_RISK_DAYS = 2
const HEADER = TAB_HEADERS.Tasks as unknown as string[]
const LOG_HEADER = TAB_HEADERS.ActivityLog as unknown as string[]

export interface ActionResult {
  ok: boolean
  error?: string
}

async function loadContext(taskId: string): Promise<{ task: Task; project: Project; leadTeamIds: string[] } | null> {
  const [tasks, projects, teams] = await Promise.all([
    getTab('Tasks').then((r) => r.map(parseTask)),
    getTab('Projects').then((r) => r.map(parseProject)),
    getTab('Teams').then((r) => r.map(parseTeam)),
  ])
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null
  const project = projects.find((p) => p.id === task.projectId)
  if (!project) return null
  return { task, project, leadTeamIds: teamsLedByCurrent(teams) }
}

function teamsLedByCurrent(teams: Team[]): string[] {
  // จะกรองด้วย user id หลัง getCurrentUser ใน caller; ที่นี่คืนทั้งหมดไว้ให้ caller map
  return teams.map((t) => `${t.id}:${t.leadUserId}`)
}

function recomputeSla(task: Task): Task {
  const isDone = task.columnStatus.toLowerCase() === 'done'
  return { ...task, slaStatus: computeSlaStatus({ dueDate: task.dueDate, isDone, now: new Date(), tz: TZ, atRiskDays: AT_RISK_DAYS }) }
}

export interface NewTaskInput {
  title: string
  assigneeId: string
  startDate: string
  dueDate: string
  description?: string
}

/** สร้าง task ใหม่ในโปรเจกต์ — ต้องมีสิทธิ์แก้โปรเจกต์นั้น */
export async function createTaskAction(projectId: string, input: NewTaskInput): Promise<{ ok: boolean; error?: string }> {
  if (!sheetsConfigured()) return { ok: true }
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!input.title.trim()) return { ok: false, error: 'ต้องมีชื่องาน' }

  const [tasks, projects, teams] = await Promise.all([
    getTab('Tasks').then((r) => r.map(parseTask)),
    getTab('Projects').then((r) => r.map(parseProject)),
    getTab('Teams').then((r) => r.map(parseTeam)),
  ])
  const project = projects.find((p) => p.id === projectId)
  if (!project) return { ok: false, error: 'not found' }
  const leadTeamIds = teams.filter((t) => t.leadUserId === user.id).map((t) => t.id)
  if (!canEditProject(user, project, leadTeamIds)) return { ok: false, error: 'forbidden' }

  const now = new Date().toISOString()
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const maxOrder = projectTasks.reduce((m, t) => Math.max(m, t.order), -1)
  // งานใหม่เริ่มที่ 'To Do' ถ้ามี (ไม่ใช่ Pending) ไม่งั้นคอลัมน์แรก
  const firstColumn = project.kanbanColumns.includes('To Do') ? 'To Do' : project.kanbanColumns[0] || 'To Do'

  const task: Task = {
    id: `k${tasks.length + 1}-${Date.now()}`,
    projectId,
    title: input.title.trim(),
    assigneeId: input.assigneeId,
    columnStatus: firstColumn,
    startDate: input.startDate,
    dueDate: input.dueDate,
    slaStatus: computeSlaStatus({ dueDate: input.dueDate, isDone: false, now: new Date(), tz: TZ, atRiskDays: AT_RISK_DAYS }),
    editCount: 0,
    description: input.description || '',
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  }
  await appendRows('Tasks', [serializeTask(task)], HEADER)
  await appendRows('ActivityLog', [serializeLog({
    id: `${task.id}-${now}-create`, timestamp: now, actorId: user.id,
    entityType: 'task', entityId: task.id, action: 'create', field: 'title', oldValue: '', newValue: task.title,
  })], LOG_HEADER)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true }
}

/** แก้ไขรายละเอียด task — ตรวจสิทธิ์ + optimistic lock (updatedAt) + editCount + log */
export async function editTaskAction(taskId: string, changes: Partial<Task>, expectedUpdatedAt?: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true } // dev: client เก็บ state เอง
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const ctx = await loadContext(taskId)
  if (!ctx) return { ok: false, error: 'not found' }
  const leadTeamIds = ctx.leadTeamIds.filter((s) => s.endsWith(':' + user.id)).map((s) => s.split(':')[0])
  if (!canEditTask(user, ctx.task, ctx.project, leadTeamIds)) return { ok: false, error: 'forbidden' }
  if (expectedUpdatedAt && ctx.task.updatedAt !== expectedUpdatedAt) {
    return { ok: false, error: 'conflict: มีการแก้ไขจากที่อื่น กรุณารีเฟรช' }
  }

  const now = new Date().toISOString()
  const { task: edited, logs } = applyTaskEdit(ctx.task, changes, user.id, now)
  if (logs.length === 0) return { ok: true }
  const final = recomputeSla(edited)
  await updateRowById('Tasks', taskId, serializeTask(final), HEADER)
  await appendRows('ActivityLog', logs.map(serializeLog), LOG_HEADER)
  revalidatePath(`/projects/${ctx.project.id}`)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true }
}

/** ย้าย task ไปคอลัมน์ใหม่ — log action=move + คำนวณ SLA ใหม่ */
export async function moveTaskAction(taskId: string, toColumn: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const ctx = await loadContext(taskId)
  if (!ctx) return { ok: false, error: 'not found' }
  const leadTeamIds = ctx.leadTeamIds.filter((s) => s.endsWith(':' + user.id)).map((s) => s.split(':')[0])
  if (!canEditTask(user, ctx.task, ctx.project, leadTeamIds)) return { ok: false, error: 'forbidden' }
  if (ctx.task.columnStatus === toColumn) return { ok: true }

  const now = new Date().toISOString()
  const log = makeMoveLog(ctx.task, toColumn, user.id, now)
  const moved = recomputeSla({ ...ctx.task, columnStatus: toColumn, updatedAt: now })
  await updateRowById('Tasks', taskId, serializeTask(moved), HEADER)
  await appendRows('ActivityLog', [serializeLog(log)], LOG_HEADER)
  revalidatePath(`/projects/${ctx.project.id}`)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true }
}
