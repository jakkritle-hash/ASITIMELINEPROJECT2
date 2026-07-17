import { getWorkloadHeatmaps } from '@/lib/data/heatmap'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage } from '@/lib/domain/permissions'
import { NoAccess } from '@/components/layout/NoAccess'
import { WorkloadCalendar } from '@/components/performance/WorkloadCalendar'
import { PageHero } from '@/components/ui/PageHero'
import { Reveal } from '@/components/ui/Motion'

export const dynamic = 'force-dynamic'

export default async function WorkloadPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'workload')) return <NoAccess user={user} />

  const data = await getWorkloadHeatmaps()

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <PageHero
        title="Workload Calendar"
        badge="🗓️"
        gradient="from-teal-500 to-emerald-600"
        shadow="shadow-teal-500/30"
        subtitle="ปฏิทินภาระงานรายบุคคล — ดูว่าใครยุ่ง/ว่างช่วงไหน · ยิ่งเข้ม = งานยิ่งเยอะ · ช่องว่าง = ว่าง · hover เพื่อดูชื่องานของวันนั้น"
      />

      <Reveal delay={0.1} y={22}>
        <WorkloadCalendar data={data} />
      </Reveal>
    </main>
  )
}
