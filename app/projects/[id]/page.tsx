import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjectData } from '@/lib/data/project'
import { getAppConfig } from '@/lib/data/config'
import { getCurrentUser } from '@/lib/auth/session'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { NewTaskDialog } from '@/components/kanban/NewTaskDialog'
import { ProjectActions } from '@/components/project/ProjectActions'
import { ProjectDepartments } from '@/components/project/ProjectDepartments'
import { ProjectTeam } from '@/components/project/ProjectTeam'
import { ProjectKind } from '@/components/project/ProjectKind'
import { ProjectRename } from '@/components/project/ProjectRename'
import { ProjectDates } from '@/components/project/ProjectDates'
import { canEditProject } from '@/lib/domain/permissions'
import { AvatarGroup } from '@/components/ui/Avatar'
import { STATUS_META } from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, config, user] = await Promise.all([getProjectData(id), getAppConfig(), getCurrentUser()])
  if (!data) notFound()
  const { project, users, teams, logs } = data
  const meta = STATUS_META[project.status]
  // สลับ Main/Expand ได้เฉพาะ Admin หรือเจ้าของโปรเจกต์
  const canSetKind = !!user && (user.role === 'Admin' || project.ownerUserId === user.id)
  // แก้ชื่อ/timeline ได้ถ้าแก้โปรเจกต์ได้ (เจ้าของ/สมาชิก/หัวหน้าทีม/Admin)
  const leadTeamIds = user ? teams.filter((t) => t.leadUserId === user.id).map((t) => t.id) : []
  const canEdit = !!user && canEditProject(user, project, leadTeamIds)

  // ผู้รับผิดชอบที่เลือกได้: เฉพาะสมาชิกทีมของโปรเจกต์ (ถ้าไม่มีทีม → ทุกคน) และตัดคน Inactive ออก
  const team = teams.find((t) => t.id === project.teamId)
  const teamMemberIds = new Set(team?.memberIds ?? [])
  const active = users.filter((u) => u.active)
  const assignable = team && teamMemberIds.size > 0 ? active.filter((u) => teamMemberIds.has(u.id)) : active

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/" className="text-xs text-blue-600 hover:underline">
        ← BACK
      </Link>
      <header className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ProjectRename projectId={project.id} name={project.name} canEdit={canEdit} />
            {project.complete ? (
              <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">✅ Completed</span>
            ) : (
              <span className="rounded px-2 py-0.5 text-[11px]" style={{ backgroundColor: meta.bg, color: meta.fg }}>
                {meta.symbol} {meta.label}
              </span>
            )}
            {project.archived && <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] text-green-600">✅ Approved</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              {project.progress}% ·
              <ProjectDates projectId={project.id} startDate={project.startDate} dueDate={project.dueDate} canEdit={canEdit} />
              · {project.tasks.length} งาน
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            <ProjectKind projectId={project.id} kind={project.kind} canEdit={canSetKind} />
            <ProjectTeam projectId={project.id} teamId={project.teamId} teams={teams} />
            <ProjectDepartments projectId={project.id} departments={project.departments} options={config.departments} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AvatarGroup users={project.members} size={22} />
          <NewTaskDialog projectId={project.id} users={assignable} />
          <ProjectActions projectId={project.id} archived={project.archived} />
        </div>
      </header>

      {/* key = ชุด id ของ task: remount เมื่อมีการเพิ่ม/ลบงาน (จาก server revalidate)
          แต่การ move/edit (id เดิม) ไม่ remount จึงคง optimistic state ไว้ */}
      <KanbanBoard key={project.tasks.map((t) => t.id).join(',')} project={project} users={users} assignableUsers={assignable} initialLogs={logs} />
    </main>
  )
}
