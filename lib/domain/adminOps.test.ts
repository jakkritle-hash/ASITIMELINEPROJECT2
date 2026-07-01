import { describe, it, expect } from 'vitest'
import { updateUserRole, toggleUserActive, createTeam, addTeamMember, removeTeamMember, setTeamLead } from './adminOps'
import type { User, Team } from './types'

const users: User[] = [
  { id: 'u1', email: 'a@x.co', name: 'A', role: 'Member', avatarColor: '#000', active: true, createdAt: '' },
  { id: 'u2', email: 'b@x.co', name: 'B', role: 'Member', avatarColor: '#111', active: true, createdAt: '' },
]
const teams: Team[] = [{ id: 't1', name: 'Marketing', memberIds: ['u1'], leadUserId: 'u1', createdAt: '' }]

describe('user ops', () => {
  it('เปลี่ยนบทบาทผู้ใช้', () => {
    expect(updateUserRole(users, 'u1', 'Admin').find((u) => u.id === 'u1')!.role).toBe('Admin')
  })
  it('สลับ active', () => {
    expect(toggleUserActive(users, 'u1').find((u) => u.id === 'u1')!.active).toBe(false)
  })
})

describe('team ops', () => {
  it('สร้างทีมใหม่ต่อท้าย', () => {
    const next = createTeam(teams, 't2', 'Dev', '2026-07-01')
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ id: 't2', name: 'Dev', memberIds: [], leadUserId: '' })
  })
  it('เพิ่มสมาชิก (ไม่ซ้ำ)', () => {
    const next = addTeamMember(teams, 't1', 'u2')
    expect(next[0].memberIds).toEqual(['u1', 'u2'])
    expect(addTeamMember(next, 't1', 'u2')[0].memberIds).toEqual(['u1', 'u2'])
  })
  it('ลบสมาชิก และถ้าเป็นหัวหน้าให้เคลียร์ lead', () => {
    const next = removeTeamMember(teams, 't1', 'u1')
    expect(next[0].memberIds).toEqual([])
    expect(next[0].leadUserId).toBe('')
  })
  it('ตั้งหัวหน้าทีม (ต้องเป็นสมาชิกก่อน)', () => {
    const withMember = addTeamMember(teams, 't1', 'u2')
    expect(setTeamLead(withMember, 't1', 'u2')[0].leadUserId).toBe('u2')
    expect(setTeamLead(teams, 't1', 'u2')[0].leadUserId).toBe('u1') // u2 ยังไม่ใช่สมาชิก → ไม่เปลี่ยน
  })
})
