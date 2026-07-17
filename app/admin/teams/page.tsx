import { getAdminData } from '@/lib/data/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage, canManageMembers } from '@/lib/domain/permissions'
import { TeamsManager } from '@/components/admin/TeamsManager'
import { NoAccess } from '@/components/layout/NoAccess'
import { PageHero } from '@/components/ui/PageHero'
import { Reveal } from '@/components/ui/Motion'

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
      <PageHero
        title="Team"
        badge="🤝"
        gradient="from-sky-500 to-cyan-500"
        shadow="shadow-sky-500/30"
        subtitle="สร้างทีม เพิ่ม/ลบสมาชิก และตั้งหัวหน้าทีม (★)"
      >
        {usingFixtures && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>}
      </PageHero>
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
