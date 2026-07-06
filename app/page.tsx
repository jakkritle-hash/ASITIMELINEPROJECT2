import { getDashboardData } from '@/lib/data/dashboard'
import { getAdminData } from '@/lib/data/admin'
import { getAppConfig } from '@/lib/data/config'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage } from '@/lib/domain/permissions'
import { GanttChart } from '@/components/gantt/GanttChart'
import { NewProjectDialog } from '@/components/project/NewProjectDialog'
import { NoAccess } from '@/components/layout/NoAccess'

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

  // ── ระดับงาน (นับจากโปรเจกต์ที่ยังทำอยู่) ──
  const tasks = active.flatMap((p) => p.tasks)
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.columnStatus.toLowerCase() === 'done').length
  const remaining = totalTasks - doneTasks
  const overdueTasks = tasks.filter((t) => t.slaStatus === 'overdue').length
  const completion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            ภาพรวมโปรเจกต์และไทม์ไลน์ · รวม {activeWorkingDays} วันทำการ · {all.length} โปรเจกต์ทั้งหมด
            {data.usingFixtures && <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-amber-600">โหมดตัวอย่าง</span>}
          </p>
        </div>
        <NewProjectDialog teams={admin.teams} departmentOptions={config.departments} />
      </header>

      {/* แถวโปรเจกต์ */}
      <div className="animate-rise mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="กำลังทำ" value={active.length} unit="โปรเจกต์" gradient="from-indigo-500 to-blue-600" shadow="shadow-indigo-500/25"
          icon={<path d="M22 12h-4l-3 9L9 3l-3 9H2" />} />
        <Stat label="ผ่าน Approve" value={approved} unit="โปรเจกต์" gradient="from-emerald-500 to-teal-600" shadow="shadow-emerald-500/25"
          icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
        <Stat label="เกินกำหนด" value={overdue} unit="โปรเจกต์" gradient="from-rose-500 to-red-500" shadow="shadow-rose-500/25" alert={overdue > 0}
          icon={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />
        <Stat label="ใกล้ครบกำหนด" value={atRisk} unit="โปรเจกต์" gradient="from-amber-400 to-orange-500" shadow="shadow-amber-500/25" alert={atRisk > 0}
          icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />
      </div>

      {/* แถวงาน (tasks) */}
      <div className="animate-rise mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="งานทั้งหมด" value={totalTasks} unit="งาน" gradient="from-slate-500 to-slate-700" shadow="shadow-slate-500/25"
          icon={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />
        <Stat label="เสร็จแล้ว" value={doneTasks} unit="งาน" gradient="from-emerald-500 to-green-600" shadow="shadow-emerald-500/25"
          icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
        <Stat label="คงค้าง" value={remaining} unit="งาน" gradient="from-violet-500 to-purple-600" shadow="shadow-violet-500/25"
          hint={overdueTasks > 0 ? `เกินกำหนด ${overdueTasks}` : undefined}
          icon={<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>} />
        <Stat label="ความคืบหน้ารวม" value={completion} unit="%" gradient="from-indigo-500 to-blue-600" shadow="shadow-indigo-500/25" bar={completion}
          icon={<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>} />
      </div>

      <GanttChart projects={data.projects} />
    </main>
  )
}

/** การ์ดตัวเลข insight: ไอคอนไล่เฉด + เลข mono ใหญ่ (+ progress bar / hint ได้) */
function Stat({
  label,
  value,
  unit,
  gradient,
  shadow,
  icon,
  alert,
  bar,
  hint,
}: {
  label: string
  value: number
  unit: string
  gradient: string
  shadow: string
  icon: React.ReactNode
  alert?: boolean
  bar?: number
  hint?: string
}) {
  return (
    <div className="surface surface-hover flex items-center gap-3 rounded-2xl p-3.5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-inset ring-white/25 ${gradient} ${shadow}`}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-baseline gap-1">
          <span className={`font-mono text-xl font-bold ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
          <span className="text-[10px] text-slate-400">{unit}</span>
          {hint && <span className="ml-auto rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-500">{hint}</span>}
        </div>
        <div className="truncate text-[11px] font-medium text-slate-500">{label}</div>
        {bar != null && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-blue-500" style={{ width: `${bar}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
