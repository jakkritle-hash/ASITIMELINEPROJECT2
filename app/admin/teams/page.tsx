import { getAdminData } from '@/lib/data/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage, canManageMembers } from '@/lib/domain/permissions'
import { TeamsManager } from '@/components/admin/TeamsManager'
import { NoAccess } from '@/components/layout/NoAccess'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'teams')) return <NoAccess user={user} />
  // ทุกคนสร้าง/จัดการทีมได้ (requirement: ไม่ต้อง lock) — เหลือเฉพาะ "ลบทีม" ที่ Admin
  const canDelete = canManageMembers(user)

  const { users, teams, usingFixtures } = await getAdminData()
  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <p className="text-xs text-gray-500">สร้างทีม เพิ่ม/ลบสมาชิก และตั้งหัวหน้าทีม (★)</p>
        </div>
        <div className="flex items-center gap-2">
          {usingFixtures && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>}
        </div>
      </header>
      {/* key = ลายเซ็นข้อมูลทีม: remount เมื่อข้อมูลจาก server เปลี่ยน (หลัง router.refresh / แก้จากที่อื่น) */}
      <TeamsManager
        key={teams.map((t) => `${t.id}:${t.name}:${t.leadUserId}:${t.memberIds.join('|')}`).join(',')}
        users={users}
        teams={teams}
        canEdit
        canDelete={canDelete}
      />
    </main>
  )
}
