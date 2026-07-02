import type { User, Team, Project, Task } from '@/lib/domain/types'

export const FIXTURE_USERS: User[] = [
  { id: 'u1', email: 'somchai@planbmedia.co.th', name: 'สมชาย', role: 'Manager', avatarColor: '#4f7cff', active: true, createdAt: '2026-01-01' },
  { id: 'u2', email: 'manee@planbmedia.co.th', name: 'มานี', role: 'Member', avatarColor: '#22b07d', active: true, createdAt: '2026-01-01' },
  { id: 'u3', email: 'piti@planbmedia.co.th', name: 'ปิติ', role: 'Member', avatarColor: '#ef5da8', active: true, createdAt: '2026-01-01' },
  { id: 'u4', email: 'anong@planbmedia.co.th', name: 'อนงค์', role: 'Member', avatarColor: '#8a63d2', active: true, createdAt: '2026-01-01' },
  { id: 'u5', email: 'wina@planbmedia.co.th', name: 'วีณา', role: 'Member', avatarColor: '#f5a623', active: true, createdAt: '2026-01-01' },
]

export const FIXTURE_TEAMS: Team[] = [
  { id: 't1', name: 'Marketing', memberIds: ['u1', 'u2', 'u5'], leadUserId: 'u1', createdAt: '2026-01-05' },
  { id: 't2', name: 'Dev', memberIds: ['u3', 'u4'], leadUserId: 'u3', createdAt: '2026-01-05' },
]

export const FIXTURE_PROJECTS: Project[] = [
  {
    id: 'p1', name: 'Rebrand เว็บบริษัท', teamId: 't1', memberIds: ['u1', 'u2', 'u4'], ownerUserId: 'u1',
    startDate: '2026-07-01', dueDate: '2026-08-20', status: 'on-track',
    description: 'ออกแบบและพัฒนาเว็บใหม่', kanbanColumns: ['To Do', 'In Progress', 'Review', 'Done'], departments: ['Digital', 'Billboard', 'Store'], archived: false,
    createdAt: '2026-06-20', updatedAt: '2026-06-28',
  },
  {
    id: 'p2', name: 'แคมเปญ Q3 (ยิงแอด)', teamId: 't1', memberIds: ['u5', 'u1'], ownerUserId: 'u5',
    startDate: '2026-07-10', dueDate: '2026-09-05', status: 'at-risk',
    description: 'แคมเปญโฆษณาไตรมาส 3', kanbanColumns: ['To Do', 'In Progress', 'Review', 'Done'], departments: ['Airport', '7-Eleven', 'BUS', 'Static'], archived: false,
    createdAt: '2026-06-25', updatedAt: '2026-06-29',
  },
  {
    id: 'p3', name: 'ระบบ CRM ภายใน', teamId: 't2', memberIds: ['u3', 'u4'], ownerUserId: 'u3',
    startDate: '2026-06-15', dueDate: '2026-10-01', status: 'overdue',
    description: 'พัฒนา CRM สำหรับทีมขาย', kanbanColumns: ['To Do', 'In Progress', 'Review', 'Done'], departments: ['OI', 'Construction'], archived: false,
    createdAt: '2026-06-10', updatedAt: '2026-06-27',
  },
]

export const FIXTURE_TASKS: Task[] = [
  // p1
  { id: 'k1', projectId: 'p1', title: 'ออกแบบ Wireframe', assigneeId: 'u2', columnStatus: 'Done', startDate: '2026-07-01', dueDate: '2026-07-08', slaStatus: 'done', editCount: 4, description: '', order: 0, createdAt: '2026-07-01', updatedAt: '2026-07-08' },
  { id: 'k2', projectId: 'p1', title: 'เขียน Copy หน้าแรก', assigneeId: 'u1', columnStatus: 'In Progress', startDate: '2026-07-05', dueDate: '2026-07-02', slaStatus: 'on-track', editCount: 3, description: '', order: 1, createdAt: '2026-07-02', updatedAt: '2026-07-05' },
  { id: 'k3', projectId: 'p1', title: 'พัฒนา Frontend', assigneeId: 'u4', columnStatus: 'To Do', startDate: '2026-07-15', dueDate: '2026-08-15', slaStatus: 'on-track', editCount: 0, description: '', order: 2, createdAt: '2026-07-01', updatedAt: '2026-07-01' },
  // p2
  { id: 'k4', projectId: 'p2', title: 'วางแผน Media', assigneeId: 'u5', columnStatus: 'In Progress', startDate: '2026-07-10', dueDate: '2026-07-03', slaStatus: 'on-track', editCount: 2, description: '', order: 0, createdAt: '2026-07-01', updatedAt: '2026-07-02' },
  { id: 'k5', projectId: 'p2', title: 'ทำ Creative', assigneeId: 'u1', columnStatus: 'To Do', startDate: '2026-07-20', dueDate: '2026-08-10', slaStatus: 'on-track', editCount: 0, description: '', order: 1, createdAt: '2026-07-01', updatedAt: '2026-07-01' },
  // p3
  { id: 'k6', projectId: 'p3', title: 'ออกแบบ Database', assigneeId: 'u3', columnStatus: 'In Progress', startDate: '2026-06-15', dueDate: '2026-06-30', slaStatus: 'overdue', editCount: 6, description: '', order: 0, createdAt: '2026-06-15', updatedAt: '2026-06-28' },
  { id: 'k7', projectId: 'p3', title: 'ทำ API', assigneeId: 'u4', columnStatus: 'To Do', startDate: '2026-07-01', dueDate: '2026-08-01', slaStatus: 'on-track', editCount: 1, description: '', order: 1, createdAt: '2026-06-20', updatedAt: '2026-06-25' },
]
