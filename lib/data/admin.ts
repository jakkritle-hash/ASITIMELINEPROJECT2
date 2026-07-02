import type { User, Team } from '@/lib/domain/types'
import { getTabCached } from '@/lib/sheets/repository'
import { parseUser, parseTeam } from '@/lib/sheets/schema'
import { sheetsConfigured } from './dashboard'
import { FIXTURE_USERS, FIXTURE_TEAMS } from './fixtures'

export interface AdminData {
  users: User[]
  teams: Team[]
  usingFixtures: boolean
}

/** ดึงข้อมูลสำหรับหน้า Admin — จาก Sheets ถ้าตั้งค่าแล้ว ไม่งั้น fixtures */
export async function getAdminData(): Promise<AdminData> {
  if (!sheetsConfigured()) {
    return { users: FIXTURE_USERS, teams: FIXTURE_TEAMS, usingFixtures: true }
  }
  const [users, teams] = await Promise.all([
    getTabCached('Users').then((rows) => rows.map(parseUser)),
    getTabCached('Teams').then((rows) => rows.map(parseTeam)),
  ])
  return { users, teams, usingFixtures: false }
}
