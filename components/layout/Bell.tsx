'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { NotificationItem } from '@/lib/data/notifications'

const ICON: Record<NotificationItem['kind'], string> = { overdue: '🔴', 'at-risk': '🟠', activity: '✏️' }

function fmt(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}

export function Bell({ items, unread }: { items: NotificationItem[]; unread: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
        title="การแจ้งเตือน"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800">การแจ้งเตือน</div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">ยังไม่มีการแจ้งเตือน</p>
            ) : (
              <ul>
                {items.map((n) => {
                  const body = (
                    <div className="flex gap-2 px-4 py-2.5 hover:bg-gray-50">
                      <span className="shrink-0">{ICON[n.kind]}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700">{n.text}</p>
                        {n.timestamp && <p className="mt-0.5 text-[10px] text-gray-400">{fmt(n.timestamp)}</p>}
                      </div>
                    </div>
                  )
                  return (
                    <li key={n.id} className="border-b border-gray-50 last:border-0">
                      {n.href ? (
                        <Link href={n.href} onClick={() => setOpen(false)}>{body}</Link>
                      ) : (
                        body
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
