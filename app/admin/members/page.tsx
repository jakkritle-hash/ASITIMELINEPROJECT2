import { getAdminData } from '@/lib/data/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage, canManageMembers } from '@/lib/domain/permissions'
import { MembersTable } from '@/components/admin/MembersTable'
import { NewMemberDialog } from '@/components/admin/NewMemberDialog'
import { PageAccessMatrix } from '@/components/admin/PageAccessMatrix'
import { NoAccess } from '@/components/layout/NoAccess'
import { PageHero } from '@/components/ui/PageHero'
import { Reveal } from '@/components/ui/Motion'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'members')) return <NoAccess user={user} />
  const canEdit = canManageMembers(user)

  const { users, usingFixtures } = await getAdminData()
  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <PageHero
        title="Team Member"
        badge="👥"
        gradient="from-violet-500 to-purple-600"
        shadow="shadow-violet-500/30"
        subtitle="กำหนดบทบาท/สถานะ และเพิ่มสมาชิก (เฉพาะ Admin)"
      >
        {usingFixtures && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>}
        {canEdit ? <NewMemberDialog /> : <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-500">Read-only</span>}
      </PageHero>
      {/* key = จำนวนผู้ใช้: remount ตารางเมื่อมีการเพิ่ม/ลบสมาชิก (จาก server revalidate) */}
      <Reveal delay={0.08} y={20}>
        <div className="gradient-ring rounded-2xl">
          <MembersTable key={users.length} users={users} canEdit={canEdit} currentUserId={user.id} />
        </div>
      </Reveal>

      <Reveal delay={0.16} y={20}>
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="section-tick h-4 w-1 rounded-full" />
            สิทธิ์การเห็นหน้าในเว็บ
          </h2>
          <p className="mb-3 text-xs text-gray-500">เปิด/ปิดว่าใครเห็นหน้าไหนได้บ้าง (Admin เห็นทุกหน้าเสมอ)</p>
          <PageAccessMatrix key={`m-${users.length}`} users={users} canEdit={canEdit} />
        </section>
      </Reveal>
    </main>
  )
}
