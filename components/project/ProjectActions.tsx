'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setProjectArchivedAction, deleteProjectAction } from '@/app/actions/projects'

export function ProjectActions({ projectId, archived }: { projectId: string; archived: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggleArchive() {
    // revalidatePath ใน action อัปเดตหน้าให้เอง — ไม่ต้อง router.refresh (กัน "Connection closed")
    startTransition(async () => {
      await setProjectArchivedAction(projectId, !archived)
    })
  }

  function remove() {
    if (!confirm('ลบโปรเจกต์นี้และงานทั้งหมดในโปรเจกต์? การลบนี้ย้อนกลับไม่ได้')) return
    startTransition(async () => {
      const res = await deleteProjectAction(projectId)
      if (res.ok) router.push('/')
      else alert(res.error || 'ลบไม่สำเร็จ')
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleArchive}
        disabled={pending}
        className={
          'btn-press rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ' +
          (archived
            ? 'border border-gray-200 text-gray-600 hover:bg-gray-100'
            : 'btn-shine bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/25')
        }
      >
        {archived ? '↩ Re-Approve' : '✅ Project Approve'}
      </button>
      <button
        onClick={remove}
        disabled={pending}
        className="btn-press rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        🗑 Delete
      </button>
    </div>
  )
}
