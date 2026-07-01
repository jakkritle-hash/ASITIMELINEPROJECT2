'use server'

import { revalidatePath } from 'next/cache'
import type { Role } from '@/lib/domain/types'
import { getTab, updateRowById, appendRow } from '@/lib/sheets/repository'
import { parseUser, parseTeam, serializeUser, serializeTeam, TAB_HEADERS } from '@/lib/sheets/schema'
import { updateUserRole, toggleUserActive, addTeamMember, removeTeamMember, setTeamLead } from '@/lib/domain/adminOps'
import { canManageMembers } from '@/lib/domain/permissions'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'

const U_HEADER = TAB_HEADERS.Users as unknown as string[]
const T_HEADER = TAB_HEADERS.Teams as unknown as string[]

export interface ActionResult {
  ok: boolean
  error?: string
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!canManageMembers(user)) return { ok: false, error: 'forbidden' }
  return { ok: true }
}

export async function setRoleAction(userId: string, role: Role): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  const users = (await getTab('Users')).map(parseUser)
  const updated = updateUserRole(users, userId, role).find((u) => u.id === userId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Users', userId, serializeUser(updated), U_HEADER)
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function toggleActiveAction(userId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  const users = (await getTab('Users')).map(parseUser)
  const updated = toggleUserActive(users, userId).find((u) => u.id === userId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Users', userId, serializeUser(updated), U_HEADER)
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function createTeamAction(name: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  const existing = await getTab('Teams')
  const id = `t${existing.length + 1}-${Date.now()}`
  await appendRow('Teams', serializeTeam({ id, name, memberIds: [], leadUserId: '', createdAt: new Date().toISOString() }), T_HEADER)
  revalidatePath('/admin/teams')
  return { ok: true }
}

async function writeTeam(teamId: string, transform: (teams: ReturnType<typeof parseTeam>[]) => ReturnType<typeof parseTeam>[]): Promise<ActionResult> {
  const teams = (await getTab('Teams')).map(parseTeam)
  const updated = transform(teams).find((t) => t.id === teamId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Teams', teamId, serializeTeam(updated), T_HEADER)
  revalidatePath('/admin/teams')
  return { ok: true }
}

export async function addTeamMemberAction(teamId: string, userId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  return writeTeam(teamId, (teams) => addTeamMember(teams, teamId, userId))
}

export async function removeTeamMemberAction(teamId: string, userId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  return writeTeam(teamId, (teams) => removeTeamMember(teams, teamId, userId))
}

export async function setTeamLeadAction(teamId: string, userId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  return writeTeam(teamId, (teams) => setTeamLead(teams, teamId, userId))
}
