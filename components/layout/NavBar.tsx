import Link from 'next/link'
import { getNotifications } from '@/lib/data/notifications'
import { Bell } from './Bell'

export async function NavBar() {
  let items: Awaited<ReturnType<typeof getNotifications>>['items'] = []
  let unread = 0
  try {
    const n = await getNotifications()
    items = n.items
    unread = n.unread
  } catch {
    // ถ้าอ่าน Sheet พลาด (เช่น quota) — แสดง nav ปกติโดยไม่มีแจ้งเตือน
  }
  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2.5 sm:mr-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm ring-1 ring-inset ring-white/20">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </span>
          <span className="text-[15px] font-bold leading-none tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">ASI</span>
            <span className="text-gray-800"> Project Tracker</span>
          </span>
        </Link>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/performance">Performance</NavLink>
          <NavLink href="/admin/members">Team Member</NavLink>
          <NavLink href="/admin/teams">Team</NavLink>
        </div>

        <Bell items={items} unread={unread} />
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700"
    >
      {children}
    </Link>
  )
}
