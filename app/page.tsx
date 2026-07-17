import { getDashboardData } from '@/lib/data/dashboard'
import { getAdminData } from '@/lib/data/admin'
import { getAppConfig } from '@/lib/data/config'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage } from '@/lib/domain/permissions'
import { GanttChart } from '@/components/gantt/GanttChart'
import { NewProjectDialog } from '@/components/project/NewProjectDialog'
import { NoAccess } from '@/components/layout/NoAccess'
import { StatCard } from '@/components/dashboard/StatCard'
import { Ticker } from '@/components/dashboard/Ticker'
import { PageHero } from '@/components/ui/PageHero'
import { Reveal } from '@/components/ui/Motion'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'dashboard')) return <NoAccess user={user} />

  const [data, admin, config] = await Promise.all([getDashboardData(), getAdminData(), getAppConfig()])

  // ── ระดับโปรเจกต์ ──
  const all = data.projects
  const active = all.filter((p) => !p.archived)
  const approved = all.length - active.length // archived = ผ่าน Approve แล้ว
  const overdue = active.filter((p) => p.status === 'overdue').length
  const atRisk = active.filter((p) => p.status === 'at-risk').length
  const activeWorkingDays = active.reduce((s, p) => s + p.workingDays, 0)

  // ── นับแยกตามประเภทโปรเจกต์ (เฉพาะที่ยังทำอยู่) ──
  const byKind = {
    main: active.filter((p) => p.kind === 'main').length,
    expand: active.filter((p) => p.kind === 'expand').length,
    maintenance: active.filter((p) => p.kind === 'maintenance').length,
    revise: active.filter((p) => p.kind === 'revise').length,
  }

  // ── ระดับงาน (นับจากโปรเจกต์ที่ยังทำอยู่) ──
  const tasks = active.flatMap((p) => p.tasks)
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.columnStatus.toLowerCase() === 'done').length
  const remaining = totalTasks - doneTasks
  const overdueTasks = tasks.filter((t) => t.slaStatus === 'overdue').length
  const completion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Hero: ชื่อ shimmer + นาฬิกาสด + สรุปบรรทัดเดียว ── */}
      <PageHero
        title="Dashboard"
        badge="📡"
        clock
        subtitle={
          <>
            ภาพรวมโปรเจกต์และไทม์ไลน์ · รวม{' '}
            <span className="font-mono font-semibold text-slate-700">{activeWorkingDays}</span> วันทำการ ·{' '}
            <span className="font-mono font-semibold text-slate-700">{all.length}</span> โปรเจกต์ทั้งหมด
            {data.usingFixtures && <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-amber-600 ring-1 ring-amber-100">โหมดตัวอย่าง</span>}
          </>
        }
      >
        <NewProjectDialog teams={admin.teams} departmentOptions={config.departments} />
      </PageHero>

      {/* ── แถบสถิติวิ่งแบบจอ LED (OOH billboard) ── */}
      <Reveal delay={0.04} y={10}>
        <Ticker
          items={[
            { label: 'กำลังทำ', value: `${active.length} โปรเจกต์` },
            { label: 'ผ่าน Approve', value: `${approved} โปรเจกต์`, tone: 'ok' },
            { label: 'เกินกำหนด', value: `${overdue} โปรเจกต์`, tone: overdue > 0 ? 'bad' : 'ok' },
            { label: 'ใกล้ครบกำหนด', value: `${atRisk} โปรเจกต์`, tone: atRisk > 0 ? 'warn' : 'ok' },
            { label: 'Main', value: `${byKind.main}` },
            { label: 'Expand', value: `${byKind.expand}` },
            { label: 'Maintenance', value: `${byKind.maintenance}` },
            { label: 'Revise', value: `${byKind.revise}` },
            { label: 'งานทั้งหมด', value: `${totalTasks} งาน` },
            { label: 'เสร็จแล้ว', value: `${doneTasks} งาน`, tone: 'ok' },
            { label: 'คงค้าง', value: `${remaining} งาน`, tone: remaining > 0 ? 'warn' : 'ok' },
            { label: 'ความคืบหน้ารวม', value: `${completion}%` },
            { label: 'วันทำการรวม', value: `${activeWorkingDays} วัน` },
          ]}
        />
      </Reveal>

      {/* ── แถวโปรเจกต์ ── */}
      <SectionLabel delay={0.05} text="โปรเจกต์" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard delay={0.08} label="กำลังทำ" value={active.length} unit="โปรเจกต์" gradient="from-indigo-500 to-blue-600" shadow="shadow-indigo-500/25"
          icon={<path d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
        <StatCard delay={0.14} label="ผ่าน Approve" value={approved} unit="โปรเจกต์" gradient="from-emerald-500 to-teal-600" shadow="shadow-emerald-500/25"
          icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
        <StatCard delay={0.2} label="เกินกำหนด" value={overdue} unit="โปรเจกต์" gradient="from-rose-500 to-red-500" shadow="shadow-rose-500/25" alert={overdue > 0}
          icon={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />
        <StatCard delay={0.26} label="ใกล้ครบกำหนด" value={atRisk} unit="โปรเจกต์" gradient="from-amber-400 to-orange-500" shadow="shadow-amber-500/25" alert={atRisk > 0}
          icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />
      </div>

      {/* ── แถวประเภทโปรเจกต์ ── */}
      <SectionLabel delay={0.28} text="ประเภทโปรเจกต์" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard delay={0.32} label="Main (นับคะแนนหลัก)" value={byKind.main} unit="โปรเจกต์" gradient="from-indigo-500 to-blue-600" shadow="shadow-indigo-500/25"
          icon={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>} />
        <StatCard delay={0.38} label="Expand (งานต่อยอด)" value={byKind.expand} unit="โปรเจกต์" gradient="from-slate-500 to-slate-700" shadow="shadow-slate-500/25"
          icon={<><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>} />
        <StatCard delay={0.44} label="Maintenance (ดูแลรักษา)" value={byKind.maintenance} unit="โปรเจกต์" gradient="from-teal-500 to-emerald-600" shadow="shadow-teal-500/25"
          icon={<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />} />
        <StatCard delay={0.5} label="Revise (แก้ไข/ปรับปรุง)" value={byKind.revise} unit="โปรเจกต์" gradient="from-amber-500 to-orange-600" shadow="shadow-amber-500/25"
          icon={<><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>} />
      </div>

      {/* ── แถวงาน (tasks) ── */}
      <SectionLabel delay={0.52} text="งาน (Tasks)" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard delay={0.56} label="งานทั้งหมด" value={totalTasks} unit="งาน" gradient="from-slate-500 to-slate-700" shadow="shadow-slate-500/25"
          icon={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />
        <StatCard delay={0.62} label="เสร็จแล้ว" value={doneTasks} unit="งาน" gradient="from-emerald-500 to-green-600" shadow="shadow-emerald-500/25"
          icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
        <StatCard delay={0.68} label="คงค้าง" value={remaining} unit="งาน" gradient="from-violet-500 to-purple-600" shadow="shadow-violet-500/25"
          hint={overdueTasks > 0 ? `เกินกำหนด ${overdueTasks}` : undefined}
          icon={<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>} />
        <StatCard delay={0.74} label="ความคืบหน้ารวม" value={completion} unit="%" gradient="from-indigo-500 to-blue-600" shadow="shadow-indigo-500/25" bar={completion}
          icon={<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>} />
      </div>

      {/* ── Timeline (การ์ดขอบไล่เฉดหมุน) ── */}
      <Reveal delay={0.6} y={26}>
        <div className="gradient-ring rounded-2xl">
          <GanttChart projects={data.projects} />
        </div>
      </Reveal>
    </main>
  )
}

/** หัวเรื่องย่อยของแต่ละแถว: tick ไล่เฉดเรือง + ป้ายตัวพิมพ์เล็ก */
function SectionLabel({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <Reveal delay={delay} y={8}>
      <div className="mb-2 flex items-center gap-2">
        <span className="section-tick h-3.5 w-1 rounded-full" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{text}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-slate-900/10 to-transparent" />
      </div>
    </Reveal>
  )
}
