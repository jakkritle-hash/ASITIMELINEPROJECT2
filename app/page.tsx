import { getDashboardData } from '@/lib/data/dashboard'
import { getAdminData } from '@/lib/data/admin'
import { GanttChart } from '@/components/gantt/GanttChart'
import { NewProjectDialog } from '@/components/project/NewProjectDialog'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [data, admin] = await Promise.all([getDashboardData(), getAdminData()])
  const overdue = data.projects.filter((p) => p.status === 'overdue').length
  const atRisk = data.projects.filter((p) => p.status === 'at-risk').length

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Dashboard</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>ทั้งหมด {data.projects.length} โปรเจกต์</span>
            <span className="text-gray-400">·</span>
            <span title="วันทำการรวมทุกโปรเจกต์ (ตัดเสาร์-อาทิตย์ + วันหยุดไทย)">รวม {data.totalWorkingDays} วันทำการ</span>
            {overdue > 0 && <span className="text-red-500">🔴 {overdue} เกินกำหนด</span>}
            {atRisk > 0 && <span className="text-amber-500">🟠 {atRisk} ใกล้ครบ</span>}
            {data.usingFixtures && <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-600">โหมดตัวอย่าง</span>}
          </p>
        </div>
        <NewProjectDialog teams={admin.teams} />
      </header>

      <GanttChart projects={data.projects} />
    </main>
  )
}
