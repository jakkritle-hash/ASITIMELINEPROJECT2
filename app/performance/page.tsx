import { getPerformance } from '@/lib/data/performance'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage } from '@/lib/domain/permissions'
import { NoAccess } from '@/components/layout/NoAccess'
import { PerformanceBoard } from '@/components/performance/PerformanceBoard'
import { PageHero } from '@/components/ui/PageHero'
import { Reveal } from '@/components/ui/Motion'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'performance')) return <NoAccess user={user} />

  const { main, expand, maintenance, revise, projectNames } = await getPerformance()

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <PageHero
        title="Individual Performance"
        badge="🏆"
        gradient="from-amber-400 to-orange-500"
        shadow="shadow-amber-500/30"
        subtitle={
          <>
            จัดอันดับผลงานรายบุคคล — คิดคะแนน<span className="font-semibold text-indigo-600">แยกทีละโปรเจกต์แล้วรวมกัน</span> และ<span className="font-semibold text-indigo-600">แยกตามประเภท Main / Expand / Maintenance / Revise</span>
          </>
        }
      />

      <Reveal delay={0.1} y={22}>
        <div className="gradient-ring rounded-2xl">
          <PerformanceBoard main={main} expand={expand} maintenance={maintenance} revise={revise} projectNames={projectNames} />
        </div>
      </Reveal>
    </main>
  )
}
