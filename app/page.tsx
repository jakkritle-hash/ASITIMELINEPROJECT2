import { getDashboardData } from '@/lib/data/dashboard'
import { GanttChart } from '@/components/gantt/GanttChart'

export default async function DashboardPage() {
  const data = await getDashboardData()
  const overdue = data.projects.filter((p) => p.status === 'overdue').length
  const atRisk = data.projects.filter((p) => p.status === 'at-risk').length

  return (
    <main className="mx-auto max-w-7xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">
            ทั้งหมด {data.projects.length} โปรเจกต์
            {overdue > 0 && <span className="ml-2 text-red-500">🔴 {overdue} เกินกำหนด</span>}
            {atRisk > 0 && <span className="ml-2 text-amber-500">🟠 {atRisk} ใกล้ครบ</span>}
          </p>
        </div>
        {data.usingFixtures && (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600">
            โหมดตัวอย่าง (ยังไม่ได้ต่อ Google Sheet)
          </span>
        )}
      </header>

      <GanttChart projects={data.projects} />
    </main>
  )
}
