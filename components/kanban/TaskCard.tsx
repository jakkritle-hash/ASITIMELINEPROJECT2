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
      className="cursor-pointer rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-gray-100 transition hover:ring-blue-300"
    >
      <div className={'mb-2 text-sm font-medium ' + (isDone ? 'text-gray-400 line-through' : 'text-gray-800')}>
        {task.title}
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={task.slaStatus} />
        <Avatar user={task.assignee} size={18} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
        <span>📅 {task.dueDate}</span>
        {task.editCount > 0 && <span>✏️ {task.editCount} ครั้ง</span>}
      </div>
    </div>
  )
}
