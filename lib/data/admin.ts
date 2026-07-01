import type { User, Team } from '@/lib/domain/types'
import { FIXTURE_USERS, FIXTURE_TEAMS } from './fixtures'

export interface AdminData {
  users: User[]
  teams: Team[]
}

/** ดึงข้อมูลสำหรับหน้า Admin — ใช้ fixtures จนกว่าจะต่อ Google Sheet */
export async function getAdminData(): Promise<AdminData> {
  return { users: FIXTURE_USERS, teams: FIXTURE_TEAMS }
}
