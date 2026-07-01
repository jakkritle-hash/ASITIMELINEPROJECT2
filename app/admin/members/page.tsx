import { getAdminData } from '@/lib/data/admin'
import { MembersTable } from '@/components/admin/MembersTable'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const { users } = await getAdminData()
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">จัดการสมาชิก</h1>
          <p className="text-xs text-gray-500">เปลี่ยนบทบาทและสถานะการใช้งาน (เฉพาะ Admin)</p>
        </div>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>
      </header>
      <MembersTable users={users} />
    </main>
  )
}
