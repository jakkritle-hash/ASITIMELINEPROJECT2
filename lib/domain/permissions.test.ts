import { describe, it, expect } from 'vitest'
import { PAGE_ACCESS_NONE, canEditProject, canManageMembers, canEditTask, canAccessPage, accessiblePageKeys, effectivePageAccess, normalizePageAccess } from './permissions'
import type { User, Project, Task } from './types'

const admin: User = { id: 'u1', email: 'a@x.co', name: 'A', role: 'Admin', avatarColor: '#000', active: true, createdAt: '', pageAccess: [] }
const manager: User = { ...admin, id: 'u2', role: 'Manager' }
const member: User = { ...admin, id: 'u3', role: 'Member' }

const project: Project = {
  id: 'p1', name: 'P', teamId: 't1', memberIds: ['u3'], ownerUserId: 'u3',
  startDate: '2026-07-01', dueDate: '2026-07-31', status: 'on-track',
  description: '', kanbanColumns: ['To Do', 'Done'], departments: [], kind: 'main', archived: false, createdAt: '', updatedAt: '',
}
const task: Task = {
  id: 'k1', projectId: 'p1', title: 'T', assigneeId: 'u3', columnStatus: 'To Do',
  startDate: '2026-07-01', dueDate: '2026-07-10', slaStatus: 'on-track',
  editCount: 0, description: '', order: 0, createdAt: '', updatedAt: '',
}

describe('permissions', () => {
  it('Admin แก้ได้ทุกโปรเจกต์', () => {
    expect(canEditProject(admin, project)).toBe(true)
  })
  it('Manager แก้โปรเจกต์ในทีมตัวเองได้ (leadTeamIds มี teamId)', () => {
    expect(canEditProject(manager, project, ['t1'])).toBe(true)
  })
  it('Manager แก้โปรเจกต์นอกทีมไม่ได้', () => {
    expect(canEditProject(manager, project, ['t9'])).toBe(false)
  })
  it('Member แก้โปรเจกต์ที่ตนเป็นเจ้าของได้', () => {
    expect(canEditProject(member, project)).toBe(true)
  })
  it('Member ที่ไม่เกี่ยวข้องแก้โปรเจกต์ไม่ได้', () => {
    const outsider: User = { ...member, id: 'u9' }
    expect(canEditProject(outsider, project)).toBe(false)
  })
  it('เฉพาะ Admin จัดการ members ได้', () => {
    expect(canManageMembers(admin)).toBe(true)
    expect(canManageMembers(manager)).toBe(false)
    expect(canManageMembers(member)).toBe(false)
  })
  it('Member แก้ task ที่ตนเป็นผู้รับผิดชอบได้', () => {
    expect(canEditTask(member, task, project)).toBe(true)
  })
  it('Member แก้ task ที่ไม่ใช่ของตนและไม่ใช่โปรเจกต์ตนไม่ได้', () => {
    const outsider: User = { ...member, id: 'u9' }
    expect(canEditTask(outsider, task, project)).toBe(false)
  })
})

describe('canAccessPage', () => {
  it('Admin เข้าได้ทุกหน้า (รวมหน้า admin)', () => {
    for (const k of ['dashboard', 'performance', 'members', 'teams', 'control']) {
      expect(canAccessPage(admin, k)).toBe(true)
    }
  })
  it('Member เข้าหน้าเนื้อหาได้ตั้งต้น แต่หน้า admin ไม่ได้', () => {
    expect(canAccessPage(member, 'dashboard')).toBe(true)
    expect(canAccessPage(member, 'performance')).toBe(true)
    expect(canAccessPage(member, 'members')).toBe(false)
    expect(canAccessPage(member, 'control')).toBe(false)
  })
  it('Member ที่มี allow-list เฉพาะ dashboard เข้า performance ไม่ได้ แต่ dashboard ได้', () => {
    const restricted: User = { ...member, pageAccess: ['dashboard'] }
    expect(canAccessPage(restricted, 'performance')).toBe(false)
    expect(canAccessPage(restricted, 'dashboard')).toBe(true)
  })
  it('Member เข้า admin page ได้เมื่ออยู่ใน allow-list', () => {
    const viewer: User = { ...member, pageAccess: ['dashboard', 'members', 'control'] }
    expect(canAccessPage(viewer, 'members')).toBe(true)
    expect(canAccessPage(viewer, 'control')).toBe(true)
    expect(canManageMembers(viewer)).toBe(false)
  })
  it('sentinel ปิดทุกหน้าและ normalize ค่าที่บันทึก', () => {
    const blocked: User = { ...member, pageAccess: [PAGE_ACCESS_NONE] }
    expect(effectivePageAccess(blocked)).toEqual([])
    expect(accessiblePageKeys(blocked)).toEqual([])
    expect(normalizePageAccess([])).toEqual([PAGE_ACCESS_NONE])
    expect(normalizePageAccess(['dashboard', 'dashboard', 'unknown'])).toEqual(['dashboard'])
  })
  it('accessiblePageKeys: Member = หน้าเนื้อหา, Admin = ทุกหน้า', () => {
    expect(accessiblePageKeys(member)).toEqual(['dashboard', 'performance'])
    expect(accessiblePageKeys(admin)).toEqual(['dashboard', 'performance', 'members', 'teams', 'control'])
  })
})
