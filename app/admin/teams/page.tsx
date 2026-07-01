import { getAdminData } from '@/lib/data/admin'
import { TeamsManager } from '@/components/admin/TeamsManager'

export default async function TeamsPage() {
  const { users, teams } = await getAdminData()
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">จัดการทีม</h1>
          <p className="text-xs text-gray-500">สร้างทีม เพิ่ม/ลบสมาชิก และตั้งหัวหน้าทีม (★)</p>
        </div>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">โหมดตัวอย่าง</span>
      </header>
      <TeamsManager users={users} teams={teams} />
    </main>
  )
}
