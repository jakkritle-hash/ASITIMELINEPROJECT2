'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { Project } from '@/lib/domain/types'
import { getTab, appendRow, invalidateSheetCache } from '@/lib/sheets/repository'
import { serializeProject, TAB_HEADERS } from '@/lib/sheets/schema'
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
    createdAt: now,
    updatedAt: now,
  }
  await appendRow('Projects', serializeProject(project), P_HEADER)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true, id }
}
