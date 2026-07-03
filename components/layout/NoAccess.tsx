import Link from 'next/link'
import type { User } from '@/lib/domain/types'
import { PAGES } from '@/lib/domain/pages'
import { accessiblePageKeys } from '@/lib/domain/permissions'

/** แสดงเมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึงหน้านี้ (ไม่ redirect เพื่อกันลูป) — โทนเดียวกับหน้า Login */
export function NoAccess({ user }: { user: User }) {
  const keys = new Set(accessiblePageKeys(user))
  const links = PAGES.filter((p) => keys.has(p.key))
  return (
    <main className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* blob บรรยากาศจางๆ ด้านหลัง */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="animate-blob animation-delay-4s absolute -right-12 top-10 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="animate-rise relative overflow-hidden rounded-2xl bg-white/80 px-8 py-10 shadow-[0_2px_4px_rgba(15,23,42,0.05),0_24px_48px_-16px_rgba(79,70,229,0.2)] ring-1 ring-slate-900/[0.06] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400" />
        <div className="mb-3 text-4xl">🔒</div>
        <h1 className="text-lg font-semibold text-gray-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mt-1 text-sm text-gray-500">บัญชีของคุณยังไม่ได้รับสิทธิ์ให้เห็นหน้านี้ — ติดต่อผู้ดูแล (Admin)</p>
        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {links.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                className="btn-shine btn-press rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/25"
              >
                ไปที่ {p.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
