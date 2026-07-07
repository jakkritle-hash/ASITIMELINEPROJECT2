'use server'

import { getTabCached, updateRowById } from '@/lib/sheets/repository'
import { parseUser, serializeUser, TAB_HEADERS } from '@/lib/sheets/schema'
import { presenceState, type PresenceState } from '@/lib/domain/presence'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'

const U_HEADER = TAB_HEADERS.Users as unknown as string[]

export interface PresenceUser {
  id: string
  name: string
  avatarColor: string
  state: Exclude<PresenceState, 'offline'>
}

/** อัปเดต heartbeat ของผู้ใช้ปัจจุบัน — active=true เมื่อแท็บกำลังโฟกัส/ดูอยู่ */
export async function heartbeatAction(active: boolean): Promise<{ ok: boolean }> {
  if (!sheetsConfigured()) return { ok: true }
  const user = await getCurrentUser()
  if (!user) return { ok: false }
  const now = new Date().toISOString()
  // user จาก getCurrentUser มีข้อมูลแถวครบอยู่แล้ว (updateRowById จะอ่านหาแถวเองอีกชั้น)
  const updated = { ...user, lastSeenAt: now, lastActiveAt: active ? now : user.lastActiveAt || '' }
  await updateRowById('Users', user.id, serializeUser(updated), U_HEADER)
  // ไม่ invalidate cache — presence อ่านผ่าน cache 15 วิ ก็สดพอ และเลี่ยงการ thrash
  return { ok: true }
}

/** รายชื่อผู้ที่กำลังออนไลน์ (ไม่รวมตัวเอง, ไม่รวม offline) — active มาก่อน idle */
export async function getPresenceAction(): Promise<PresenceUser[]> {
  if (!sheetsConfigured()) return []
  const me = await getCurrentUser()
  const users = (await getTabCached('Users')).map(parseUser)
  const now = Date.now()
  const online: PresenceUser[] = []
  for (const u of users) {
    if (!u.active || u.id === me?.id) continue
    const state = presenceState(u.lastSeenAt, u.lastActiveAt, now)
    if (state === 'offline') continue
    online.push({ id: u.id, name: u.name, avatarColor: u.avatarColor, state })
  }
  online.sort((a, b) => (a.state === b.state ? 0 : a.state === 'active' ? -1 : 1))
  return online
}
