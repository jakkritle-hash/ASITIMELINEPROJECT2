import { signOut } from '@/lib/auth/config'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/lib/domain/types'

// ปุ่มออกจากระบบมีผลจริงเมื่อเปิด OAuth แล้วเท่านั้น (โหมด dev ยังไม่มี session จริงให้ปิด)
const authConfigured = !!process.env.AUTH_GOOGLE_ID

/** แถบบัญชีผู้ใช้มุมขวาของ NavBar: avatar + ชื่อ/บทบาท + ปุ่มออกจากระบบ */
export function AccountMenu({ user }: { user: User | null }) {
  if (!user) return null
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center gap-2">
        <Avatar user={user} size={28} />
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[13px] font-semibold text-slate-800">{user.name}</span>
          <span className="text-[11px] font-medium text-slate-400">{user.role}</span>
        </span>
      </span>
      {authConfigured && (
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            title="ออกจากระบบ"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </form>
      )}
    </div>
  )
}
