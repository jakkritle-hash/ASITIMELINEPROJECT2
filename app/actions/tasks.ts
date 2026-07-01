'use server'

import { revalidatePath } from 'next/cache'
import type { Task, Project, Team } from '@/lib/domain/types'
import { getTab, updateRowById, appendRows } from '@/lib/sheets/repository'
import { parseTask, parseProject, parseTeam, serializeTask, serializeLog, TAB_HEADERS } from '@/lib/sheets/schema'
import { applyTaskEdit, makeMoveLog } from '@/lib/domain/activity'
import { computeSlaStatus } from '@/lib/domain/sla'
import { canEditTask } from '@/lib/domain/permissions'
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
  return { ok: true }
}
