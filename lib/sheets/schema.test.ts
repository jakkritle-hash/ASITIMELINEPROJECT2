import { describe, it, expect } from 'vitest'
import { TAB_HEADERS, parseUser, parseProject, parseTask, serializeUser, serializeProject, serializeTask } from './schema'

describe('TAB_HEADERS', () => {
  it('มีครบ 6 tab', () => {
    expect(Object.keys(TAB_HEADERS).sort()).toEqual(['ActivityLog', 'Config', 'Projects', 'Tasks', 'Teams', 'Users'])
  })
})

describe('parse', () => {
  it('parseUser แปลง active string → boolean', () => {
    const u = parseUser({ id: 'u1', email: 'a@x', name: 'A', role: 'Admin', avatarColor: '#000', active: 'true', createdAt: '' })
    expect(u.active).toBe(true)
    expect(u.role).toBe('Admin')
    expect(u.pageAccess).toEqual([])
    expect(parseUser({ id: 'u2', email: '', name: '', role: '', avatarColor: '', active: 'false', createdAt: '' }).active).toBe(false)
  })
  it('parseUser รองรับ pageAccess และ fallback จาก pageDenied เก่า', () => {
    expect(parseUser({ id: 'u1', email: '', name: '', role: 'Member', avatarColor: '', active: 'true', createdAt: '', pageAccess: 'dashboard,members' }).pageAccess).toEqual(['dashboard', 'members'])
    expect(parseUser({ id: 'u2', email: '', name: '', role: 'Member', avatarColor: '', active: 'true', createdAt: '', pageDenied: 'performance' }).pageAccess).toEqual(['dashboard'])
    expect(parseUser({ id: 'u3', email: '', name: '', role: 'Member', avatarColor: '', active: 'true', createdAt: '', pageDenied: 'dashboard,performance' }).pageAccess).toEqual(['__none__'])
  })
  it('parseProject/parseTask แปลง csv → array และตัวเลข', () => {
    const p = parseProject({ id: 'p1', name: 'P', teamId: 't1', memberIds: 'u1,u2', ownerUserId: 'u1', startDate: '', dueDate: '', status: 'at-risk', description: '', kanbanColumns: 'To Do,Done', createdAt: '', updatedAt: '' })
    expect(p.memberIds).toEqual(['u1', 'u2'])
    expect(p.kanbanColumns).toEqual(['To Do', 'Done'])
    expect(p.kind).toBe('main') // ไม่มีคอลัมน์ kind → default main (backward-compat)
    expect(parseProject({ id: 'p2', kind: 'expand' } as never).kind).toBe('expand')
    expect(parseProject({ id: 'p3', kind: 'maintenance' } as never).kind).toBe('maintenance')
    expect(parseProject({ id: 'p4', kind: 'garbage' } as never).kind).toBe('main') // ค่าแปลก → main
    const t = parseTask({ id: 'k1', projectId: 'p1', title: 'T', assigneeId: 'u1', columnStatus: 'To Do', startDate: '', dueDate: '', slaStatus: 'on-track', editCount: '3', description: '', order: '2', createdAt: '', updatedAt: '' })
    expect(t.editCount).toBe(3)
    expect(t.order).toBe(2)
  })
})

describe('serialize (round-trip)', () => {
  it('serializeProject แปลง array → csv', () => {
    const row = serializeProject(parseProject({ id: 'p1', name: 'P', teamId: 't1', memberIds: 'u1,u2', ownerUserId: 'u1', startDate: '', dueDate: '', status: 'on-track', description: '', kanbanColumns: 'To Do,Done', createdAt: '', updatedAt: '' }))
    expect(row.memberIds).toBe('u1,u2')
    expect(row.kanbanColumns).toBe('To Do,Done')
  })
  it('serializeUser/serializeTask แปลงชนิดกลับเป็น string', () => {
    expect(serializeUser(parseUser({ id: 'u1', email: '', name: '', role: 'Member', avatarColor: '', active: 'true', createdAt: '' })).active).toBe('true')
    expect(serializeUser(parseUser({ id: 'u1', email: '', name: '', role: 'Member', avatarColor: '', active: 'true', createdAt: '', pageAccess: 'dashboard,members' })).pageAccess).toBe('dashboard,members')
    expect(serializeTask(parseTask({ id: 'k1', projectId: '', title: '', assigneeId: '', columnStatus: '', startDate: '', dueDate: '', slaStatus: 'done', editCount: '5', description: '', order: '1', createdAt: '', updatedAt: '' })).editCount).toBe('5')
  })
})
