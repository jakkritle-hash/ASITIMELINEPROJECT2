import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjectData } from '@/lib/data/project'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { AvatarGroup } from '@/components/ui/Avatar'
import { STATUS_META } from '@/components/ui/StatusBadge'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProjectData(id)
  if (!data) notFound()
  const { project, users } = data
  const meta = STATUS_META[project.status]

  return (
    <main className="mx-auto max-w-7xl p-6">
      <Link href="/" className="text-xs text-blue-600 hover:underline">
        ← กลับ Dashboard
      </Link>
      <header className="mb-4 mt-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <span className="rounded px-2 py-0.5 text-[11px]" style={{ backgroundColor: meta.bg, color: meta.fg }}>
              {meta.symbol} {meta.label}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {project.startDate} → {project.dueDate} · {project.tasks.length} งาน
          </p>
        </div>
        <AvatarGroup users={project.members} size={22} />
      </header>

      <KanbanBoard project={project} users={users} />
    </main>
  )
}
