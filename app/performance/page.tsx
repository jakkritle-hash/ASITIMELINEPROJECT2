import { getPerformance } from '@/lib/data/performance'
import { getWorkloadHeatmaps } from '@/lib/data/heatmap'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage } from '@/lib/domain/permissions'
import { NoAccess } from '@/components/layout/NoAccess'
import { PerformanceBoard } from '@/components/performance/PerformanceBoard'
import { ActivityHeatmap } from '@/components/performance/ActivityHeatmap'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'performance')) return <NoAccess user={user} />

  const [{ main, expand, maintenance, projectNames }, heatmap] = await Promise.all([getPerformance(), getWorkloadHeatmaps()])

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-5">
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Individual Performance</h1>
        <p className="text-xs text-gray-500">
          จัดอันดับผลงานรายบุคคล 🏆 — คิดคะแนน<span className="font-semibold text-indigo-600">แยกทีละโปรเจกต์แล้วรวมกัน</span> และ<span className="font-semibold text-indigo-600">แยกตามประเภท Main / Expand / Maintenance</span>
        </p>
      </header>

      <PerformanceBoard main={main} expand={expand} maintenance={maintenance} projectNames={projectNames} />

      <ActivityHeatmap data={heatmap} />
    </main>
  )
}
