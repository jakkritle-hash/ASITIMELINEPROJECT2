import { getWorkloadHeatmaps } from '@/lib/data/heatmap'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage } from '@/lib/domain/permissions'
import { NoAccess } from '@/components/layout/NoAccess'
import { WorkloadCalendar } from '@/components/performance/WorkloadCalendar'

export const dynamic = 'force-dynamic'

export default async function WorkloadPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'workload')) return <NoAccess user={user} />

  const data = await getWorkloadHeatmaps()

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-5">
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Workload Calendar</h1>
        <p className="text-xs text-gray-500">
          ปฏิทินภาระงานรายบุคคล — ดูว่าใครยุ่ง/ว่างช่วงไหน · ยิ่งเข้ม = งานยิ่งเยอะ · ช่องว่าง = ว่าง · hover เพื่อดูชื่องานของวันนั้น
        </p>
      </header>

      <WorkloadCalendar data={data} />
    </main>
  )
}
