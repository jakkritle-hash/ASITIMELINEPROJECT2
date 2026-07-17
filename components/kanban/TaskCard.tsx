'use client'

import type { EnrichedTask } from '@/lib/data/dashboard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'

export function TaskCard({
  task,
  onClick,
  onDragStart,
}: {
  task: EnrichedTask
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  const isDone = task.slaStatus === 'done'
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="card-sheen cursor-pointer rounded-xl bg-white/95 p-2.5 shadow-sm ring-1 ring-gray-100 transition duration-200 hover:-translate-y-1 hover:rotate-[0.4deg] hover:shadow-lg hover:shadow-indigo-500/15 hover:ring-indigo-200 active:scale-[0.97] active:cursor-grabbing"
    >
      <div className={'mb-2 text-sm font-medium ' + (isDone ? 'text-gray-400 line-through' : 'text-gray-800')}>
        {task.title}
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={task.slaStatus} />
        <span className="flex min-w-0 items-center gap-1">
          <Avatar user={task.assignee} size={18} />
          {task.assignee && <span className="truncate text-[10px] text-gray-500">{task.assignee.name.split(' ')[0]}</span>}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
        <span>📅 {task.dueDate}</span>
        {task.editCount > 0 && <span>✏️ {task.editCount} ครั้ง</span>}
      </div>
    </div>
  )
}
