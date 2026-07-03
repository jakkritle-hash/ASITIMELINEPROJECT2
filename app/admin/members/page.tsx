import { getAdminData } from '@/lib/data/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage, canManageMembers } from '@/lib/domain/permissions'
import { MembersTable } from '@/components/admin/MembersTable'
import { NewMemberDialog } from '@/components/admin/NewMemberDialog'
import { PageAccessMatrix } from '@/components/admin/PageAccessMatrix'
import { NoAccess } from '@/components/layout/NoAccess'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'members')) return <NoAccess user={user} />
  const canEdit = canManageMembers(user)

  const { users, usingFixtures } = await getAdminData()
  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Team Member</h1>
          <p className="text-xs text-gray-500">กำหนดบทบาท/สถานะ และเพิ่มสมาชิก (เฉพาะ Admin)</p>
        </div>
        <div className="flex items-center gap-3">
          {usingFixtures && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>}
          {canEdit ? <NewMemberDialog /> : <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-500">Read-only</span>}
        </div>
      </header>
      {/* key = จำนวนผู้ใช้: remount ตารางเมื่อมีการเพิ่ม/ลบสมาชิก (จาก server revalidate) */}
      <MembersTable key={users.length} users={users} canEdit={canEdit} currentUserId={user.id} />

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
          สิทธิ์การเห็นหน้าในเว็บ
        </h2>
        <p className="mb-3 text-xs text-gray-500">เปิด/ปิดว่าใครเห็นหน้าไหนได้บ้าง (Admin เห็นทุกหน้าเสมอ)</p>
        <PageAccessMatrix key={`m-${users.length}`} users={users} canEdit={canEdit} />
      </section>
    </main>
  )
}
