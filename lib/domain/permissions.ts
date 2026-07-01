import type { User, Project, Task } from './types'

/** Admin แก้ได้ทุกอย่าง; Manager แก้ได้ถ้าโปรเจกต์อยู่ในทีมที่ตนเป็นหัวหน้า; Member แก้ได้ถ้าเป็นเจ้าของหรือสมาชิกโปรเจกต์ */
export function canEditProject(user: User, project: Project, leadTeamIds: string[] = []): boolean {
  if (user.role === 'Admin') return true
  if (user.role === 'Manager' && leadTeamIds.includes(project.teamId)) return true
  return project.ownerUserId === user.id || project.memberIds.includes(user.id)
}

/** เฉพาะ Admin จัดการผู้ใช้/บทบาท */
export function canManageMembers(user: User): boolean {
  return user.role === 'Admin'
}

/** แก้ task ได้ถ้าแก้โปรเจกต์ได้ หรือเป็นผู้รับผิดชอบ task นั้น */
export function canEditTask(user: User, task: Task, project: Project, leadTeamIds: string[] = []): boolean {
  if (canEditProject(user, project, leadTeamIds)) return true
  return task.assigneeId === user.id
}
