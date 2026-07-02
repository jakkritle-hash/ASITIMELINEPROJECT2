import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjectData } from '@/lib/data/project'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { NewTaskDialog } from '@/components/kanban/NewTaskDialog'
import { ProjectActions } from '@/components/project/ProjectActions'
import { AvatarGroup } from '@/components/ui/Avatar'
import { STATUS_META } from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProjectData(id)
  if (!data) notFound()
  const { project, users, logs } = data
  const meta = STATUS_META[project.status]

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/" className="text-xs text-blue-600 hover:underline">
        ← BACK
      </Link>
      <header className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">{project.name}</h1>
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
            <span className="text-xs text-gray-500">{project.progress}% · {project.startDate} → {project.dueDate} · {project.tasks.length} งาน</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AvatarGroup users={project.members} size={22} />
          <NewTaskDialog projectId={project.id} users={users} />
          <ProjectActions projectId={project.id} archived={project.archived} />
        </div>
      </header>

      {/* key = ชุด id ของ task: remount เมื่อมีการเพิ่ม/ลบงาน (จาก server revalidate)
          แต่การ move/edit (id เดิม) ไม่ remount จึงคง optimistic state ไว้ */}
      <KanbanBoard key={project.tasks.map((t) => t.id).join(',')} project={project} users={users} initialLogs={logs} />
    </main>
  )
}
