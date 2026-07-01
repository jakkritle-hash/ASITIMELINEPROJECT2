import { describe, it, expect } from 'vitest'
import { canEditProject, canManageMembers, canEditTask } from './permissions'
import type { User, Project, Task } from './types'

const admin: User = { id: 'u1', email: 'a@x.co', name: 'A', role: 'Admin', avatarColor: '#000', active: true, createdAt: '' }
const manager: User = { ...admin, id: 'u2', role: 'Manager' }
const member: User = { ...admin, id: 'u3', role: 'Member' }

const project: Project = {
  id: 'p1', name: 'P', teamId: 't1', memberIds: ['u3'], ownerUserId: 'u3',
  startDate: '2026-07-01', dueDate: '2026-07-31', status: 'on-track',
  description: '', kanbanColumns: ['To Do', 'Done'], createdAt: '', updatedAt: '',
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
