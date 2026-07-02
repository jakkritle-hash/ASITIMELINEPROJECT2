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
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2.5 text-sm sm:px-6">
        <Link href="/" className="mr-3 shrink-0 font-semibold text-gray-900">🗂️ Project Tracker</Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/admin/members">สมาชิก</NavLink>
          <NavLink href="/admin/teams">ทีม</NavLink>
        </div>
        <Bell items={items} unread={unread} />
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 rounded-lg px-3 py-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
      {children}
    </Link>
  )
}
