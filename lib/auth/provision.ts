import type { User } from '@/lib/domain/types'
import { getTab, appendRow } from '@/lib/sheets/repository'
import { parseUser, serializeUser, TAB_HEADERS } from '@/lib/sheets/schema'
import { initialRoleFor } from './policy'

const PALETTE = ['#4f7cff', '#22b07d', '#ef5da8', '#8a63d2', '#f5a623', '#e5484d', '#0ea5e9', '#14b8a6']

function colorFor(email: string): string {
  let h = 0
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function bootstrapAdmins(): string[] {
  return (process.env.BOOTSTRAP_ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean)
}

/**
 * provision ผู้ใช้ตอนล็อกอิน: ถ้ายังไม่มีใน Users tab → เพิ่มใหม่ (role จาก bootstrap list)
 * คืน User ปัจจุบัน (มีอยู่แล้วหรือเพิ่งสร้าง)
 */
export async function provisionUser(email: string, name: string, now: string): Promise<User> {
  const rows = await getTab('Users')
  const existing = rows.map(parseUser).find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) return existing

  const user: User = {
    id: `u${rows.length + 1}-${now.slice(0, 10)}`,
    email,
    name: name || email.split('@')[0],
    role: initialRoleFor(email, bootstrapAdmins()),
    avatarColor: colorFor(email),
    active: true,
    createdAt: now,
    pageAccess: [],
  }
  await appendRow('Users', serializeUser(user), TAB_HEADERS.Users as unknown as string[])
  return user
}
