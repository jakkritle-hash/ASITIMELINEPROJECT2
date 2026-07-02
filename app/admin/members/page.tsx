import { getAdminData } from '@/lib/data/admin'
import { MembersTable } from '@/components/admin/MembersTable'
import { NewMemberDialog } from '@/components/admin/NewMemberDialog'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const { users, usingFixtures } = await getAdminData()
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">จัดการสมาชิก</h1>
          <p className="text-xs text-gray-500">เปลี่ยนบทบาท/สถานะ และเพิ่มสมาชิก (เฉพาะ Admin)</p>
        </div>
        <div className="flex items-center gap-3">
          {usingFixtures && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>}
          <NewMemberDialog />
        </div>
      </header>
      {/* key = จำนวนผู้ใช้: remount ตารางเมื่อมีการเพิ่มสมาชิก (จาก server revalidate) */}
      <MembersTable key={users.length} users={users} />
    </main>
  )
}
