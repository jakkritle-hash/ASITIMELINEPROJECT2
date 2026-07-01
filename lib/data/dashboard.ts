import type { User, Project, Task, SlaStatus } from '@/lib/domain/types'
import { computeSlaStatus } from '@/lib/domain/sla'
import { FIXTURE_USERS, FIXTURE_PROJECTS, FIXTURE_TASKS } from './fixtures'

const TZ = 'Asia/Bangkok'
const AT_RISK_DAYS = 2

export interface EnrichedTask extends Task {
  assignee?: User
}
export interface EnrichedProject extends Project {
  members: User[]
  tasks: EnrichedTask[]
}
export interface DashboardData {
  projects: EnrichedProject[]
  usingFixtures: boolean
}

/** ความรุนแรงของสถานะ เพื่อหา "แย่สุด" ของโปรเจกต์ */
const SEVERITY: Record<SlaStatus, number> = { done: 0, 'on-track': 1, 'at-risk': 2, overdue: 3 }

function worstStatus(statuses: SlaStatus[]): SlaStatus {
  const active = statuses.filter((s) => s !== 'done')
  if (active.length === 0) return statuses.length ? 'done' : 'on-track'
  return active.reduce((worst, s) => (SEVERITY[s] > SEVERITY[worst] ? s : worst), 'on-track' as SlaStatus)
}

function enrich(users: User[], projects: Project[], tasks: Task[], now: Date): EnrichedProject[] {
  const usersById = new Map(users.map((u) => [u.id, u]))
  return projects.map((p) => {
    const projTasks: EnrichedTask[] = tasks
      .filter((t) => t.projectId === p.id)
      .sort((a, b) => a.order - b.order)
      .map((t) => {
        const isDone = t.columnStatus.toLowerCase() === 'done'
        const slaStatus = computeSlaStatus({ dueDate: t.dueDate, isDone, now, tz: TZ, atRiskDays: AT_RISK_DAYS })
        return { ...t, slaStatus, assignee: usersById.get(t.assigneeId) }
      })
    return {
      ...p,
      members: p.memberIds.map((id) => usersById.get(id)).filter((u): u is User => !!u),
      tasks: projTasks,
      status: worstStatus(projTasks.map((t) => t.slaStatus)),
    }
  })
}

/** ดึงข้อมูล dashboard — ใช้ fixtures ถ้ายังไม่ได้ตั้งค่า service account */
export async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  const hasSheets = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  if (!hasSheets) {
    return { projects: enrich(FIXTURE_USERS, FIXTURE_PROJECTS, FIXTURE_TASKS, now), usingFixtures: true }
  }
  // Path Sheets จริงจะต่อในเฟส 3 (อ่านจาก getTab + parse) — ตอนนี้ fallback fixtures
  return { projects: enrich(FIXTURE_USERS, FIXTURE_PROJECTS, FIXTURE_TASKS, now), usingFixtures: true }
}
