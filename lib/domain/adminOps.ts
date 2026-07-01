import type { User, Team, Role } from './types'

/** เปลี่ยนบทบาทผู้ใช้ (immutable) */
export function updateUserRole(users: User[], userId: string, role: Role): User[] {
  return users.map((u) => (u.id === userId ? { ...u, role } : u))
}

/** สลับสถานะ active ของผู้ใช้ */
export function toggleUserActive(users: User[], userId: string): User[] {
  return users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
}

/** สร้างทีมใหม่ต่อท้าย (สมาชิกว่าง, ยังไม่มีหัวหน้า) */
export function createTeam(teams: Team[], id: string, name: string, createdAt: string): Team[] {
  return [...teams, { id, name, memberIds: [], leadUserId: '', createdAt }]
}

/** เพิ่มสมาชิกเข้าทีม (ไม่ซ้ำ) */
export function addTeamMember(teams: Team[], teamId: string, userId: string): Team[] {
  return teams.map((t) =>
    t.id === teamId && !t.memberIds.includes(userId) ? { ...t, memberIds: [...t.memberIds, userId] } : t,
  )
}

/** ลบสมาชิกออกจากทีม และถ้าเป็นหัวหน้าให้เคลียร์ leadUserId */
export function removeTeamMember(teams: Team[], teamId: string, userId: string): Team[] {
  return teams.map((t) =>
    t.id === teamId
      ? { ...t, memberIds: t.memberIds.filter((id) => id !== userId), leadUserId: t.leadUserId === userId ? '' : t.leadUserId }
      : t,
  )
}

/** ตั้งหัวหน้าทีม — ต้องเป็นสมาชิกอยู่แล้วเท่านั้น */
export function setTeamLead(teams: Team[], teamId: string, userId: string): Team[] {
  return teams.map((t) => (t.id === teamId && t.memberIds.includes(userId) ? { ...t, leadUserId: userId } : t))
}
