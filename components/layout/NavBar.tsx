import Link from 'next/link'
import type { User } from '@/lib/domain/types'
import { getNotifications } from '@/lib/data/notifications'
import { getCurrentUser } from '@/lib/auth/session'
import { accessiblePageKeys } from '@/lib/domain/permissions'
import { Bell } from './Bell'
import { Presence } from './Presence'
import { NavLinks } from './NavLinks'
import { AccountMenu } from './AccountMenu'

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

  // แสดงเฉพาะเมนูที่ผู้ใช้ปัจจุบันเข้าถึงได้
  let user: User | null = null
  let allowed: string[] = []
  try {
    user = await getCurrentUser()
    if (user) allowed = accessiblePageKeys(user)
  } catch {
    // ไม่มี user / อ่านพลาด — ไม่แสดงเมนู
  }
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-900/[0.07] bg-white/70 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.15)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5 sm:flex-nowrap sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group order-1 mr-2 flex shrink-0 items-center gap-2.5 sm:mr-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-inset ring-white/25 transition-transform duration-300 group-hover:-rotate-6">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </span>
          <span className="text-[15px] font-bold leading-none tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">ASI</span>
            <span className="text-slate-800"> Project Tracker</span>
          </span>
        </Link>

        {/* เมนู: มือถือ = แถวที่สองเต็มความกว้าง (order-3 w-full), เดสก์ท็อป = อยู่กลางแถวเดียว (sm:order-2) */}
        <div className="order-3 w-full sm:order-2 sm:w-auto">
          <NavLinks allowed={allowed} />
        </div>

        <div className="order-2 ml-auto flex items-center gap-2.5 sm:order-3">
          <Presence />
          <Bell items={items} unread={unread} />
          <AccountMenu user={user} />
        </div>
      </div>
    </nav>
  )
}
