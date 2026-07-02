import Link from 'next/link'
import type { User } from '@/lib/domain/types'
import { PAGES } from '@/lib/domain/pages'
import { accessiblePageKeys } from '@/lib/domain/permissions'

/** แสดงเมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึงหน้านี้ (ไม่ redirect เพื่อกันลูป) */
export function NoAccess({ user }: { user: User }) {
  const keys = new Set(accessiblePageKeys(user))
  const links = PAGES.filter((p) => keys.has(p.key))
  return (
    <main className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 text-center">
      <div className="animate-rise rounded-2xl bg-white/80 px-8 py-10 shadow-sm ring-1 ring-gray-100 backdrop-blur">
        <div className="mb-3 text-4xl">🔒</div>
        <h1 className="text-lg font-semibold text-gray-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mt-1 text-sm text-gray-500">บัญชีของคุณยังไม่ได้รับสิทธิ์ให้เห็นหน้านี้ — ติดต่อผู้ดูแล (Admin)</p>
        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {links.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
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
