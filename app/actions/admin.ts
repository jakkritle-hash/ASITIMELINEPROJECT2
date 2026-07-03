'use server'

import { revalidatePath } from 'next/cache'
import type { Role, User } from '@/lib/domain/types'
import { getTab, updateRowById, appendRow, deleteRowById, invalidateSheetCache } from '@/lib/sheets/repository'
import { parseUser, parseTeam, serializeUser, serializeTeam, TAB_HEADERS } from '@/lib/sheets/schema'
import { updateUserRole, toggleUserActive, setUserPageAccess, addTeamMember, removeTeamMember, setTeamLead } from '@/lib/domain/adminOps'
import { canManageMembers, normalizePageAccess } from '@/lib/domain/permissions'
import { isAllowedEmail } from '@/lib/auth/policy'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'planbmedia.co.th'
const PALETTE = ['#4f7cff', '#22b07d', '#ef5da8', '#8a63d2', '#f5a623', '#e5484d', '#0ea5e9', '#14b8a6']

const U_HEADER = TAB_HEADERS.Users as unknown as string[]
const T_HEADER = TAB_HEADERS.Teams as unknown as string[]

export interface ActionResult {
  ok: boolean
  error?: string
}

async function requireAdmin(): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!canManageMembers(user)) return { ok: false, error: 'forbidden' }
  return { ok: true, user }
}

/** สร้างสมาชิกใหม่ด้วยตนเอง (Admin) — ตรวจโดเมน + กันอีเมลซ้ำ
 *  หมายเหตุ: ผู้ใช้ที่ล็อกอิน Google @planbmedia.co.th จะถูกเพิ่มอัตโนมัติอยู่แล้ว (provisionUser) */
export async function createMemberAction(input: { email: string; name: string; role: Role }): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  const email = input.email.trim().toLowerCase()
  if (!isAllowedEmail(email, ALLOWED_DOMAIN)) return { ok: false, error: `ต้องเป็นอีเมล @${ALLOWED_DOMAIN}` }

  const users = (await getTab('Users')).map(parseUser)
  if (users.some((u) => u.email.toLowerCase() === email)) return { ok: false, error: 'มีอีเมลนี้อยู่แล้ว' }

  const user: User = {
    id: `u${users.length + 1}-${Date.now()}`,
    email,
    name: input.name.trim() || email.split('@')[0],
    role: input.role,
    avatarColor: PALETTE[users.length % PALETTE.length],
    active: true,
    createdAt: new Date().toISOString(),
    pageAccess: [],
  }
  await appendRow('Users', serializeUser(user), U_HEADER)
  revalidatePath('/admin/members')
  invalidateSheetCache()
  return { ok: true }
}

export async function setRoleAction(userId: string, role: Role): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  // กันล็อกตัวเองออกจากระบบจัดการ: Admin เปลี่ยนบทบาทตัวเองออกจาก Admin ไม่ได้
  if (gate.user.id === userId && role !== 'Admin') return { ok: false, error: 'เปลี่ยนบทบาทตัวเองออกจาก Admin ไม่ได้' }
  const users = (await getTab('Users')).map(parseUser)
  const updated = updateUserRole(users, userId, role).find((u) => u.id === userId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Users', userId, serializeUser(updated), U_HEADER)
  revalidatePath('/admin/members')
  invalidateSheetCache()
  return { ok: true }
}

export async function toggleActiveAction(userId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  // กันปิดบัญชีตัวเอง (จะล็อกตัวเองออกจากระบบทันที)
  if (gate.user.id === userId) return { ok: false, error: 'ปิด/เปิดการใช้งานบัญชีตัวเองไม่ได้' }
  const users = (await getTab('Users')).map(parseUser)
  const updated = toggleUserActive(users, userId).find((u) => u.id === userId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Users', userId, serializeUser(updated), U_HEADER)
  revalidatePath('/admin/members')
  invalidateSheetCache()
  return { ok: true }
}

/** ลบสมาชิกถาวรออกจาก Users tab — Admin เท่านั้น, ห้ามลบบัญชีตัวเอง
 *  หมายเหตุ: ถ้าลบอีเมลที่อยู่ใน BOOTSTRAP_ADMIN_EMAILS เขาจะถูกสร้างกลับเป็น Admin เมื่อล็อกอินครั้งถัดไป */
export async function deleteMemberAction(userId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  if (gate.user.id === userId) return { ok: false, error: 'ลบบัญชีตัวเองไม่ได้' }
  const ok = await deleteRowById('Users', userId)
  if (!ok) return { ok: false, error: 'not found' }
  revalidatePath('/admin/members')
  invalidateSheetCache()
  return { ok: true }
}

/** ตั้งสิทธิ์เห็นหน้าของผู้ใช้ (allow-list หน้าที่เห็นได้) — Admin เท่านั้น */
export async function setUserPageAccessAction(userId: string, allowedPages: string[]): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  const users = (await getTab('Users')).map(parseUser)
  const updated = setUserPageAccess(users, userId, normalizePageAccess(allowedPages)).find((u) => u.id === userId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Users', userId, serializeUser(updated), U_HEADER)
  invalidateSheetCache()
  // หมายเหตุ: ไม่ revalidatePath('/', 'layout') — การ revalidate ทั้ง layout ระหว่าง
  // เรียก action แบบ fire-and-forget ทำให้ RSC stream ถูกยกเลิก → "Connection closed"
  // เมนู nav ของผู้ใช้ที่ถูกแก้จะอัปเดตเองตอนโหลดหน้าครั้งถัดไป (หน้าเป็น force-dynamic)
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
  invalidateSheetCache()
  return { ok: true }
}

async function writeTeam(teamId: string, transform: (teams: ReturnType<typeof parseTeam>[]) => ReturnType<typeof parseTeam>[]): Promise<ActionResult> {
  const teams = (await getTab('Teams')).map(parseTeam)
  const updated = transform(teams).find((t) => t.id === teamId)
  if (!updated) return { ok: false, error: 'not found' }
  await updateRowById('Teams', teamId, serializeTeam(updated), T_HEADER)
  revalidatePath('/admin/teams')
  invalidateSheetCache()
  return { ok: true }
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  await deleteRowById('Teams', teamId)
  revalidatePath('/admin/teams')
  invalidateSheetCache()
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
