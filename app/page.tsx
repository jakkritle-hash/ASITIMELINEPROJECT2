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
  const active = data.projects.filter((p) => !p.archived)
  const overdue = active.filter((p) => p.status === 'overdue').length
  const atRisk = active.filter((p) => p.status === 'at-risk').length
  const activeWorkingDays = active.reduce((s, p) => s + p.workingDays, 0)

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            ภาพรวมโปรเจกต์และไทม์ไลน์ทั้งหมด
            {data.usingFixtures && <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-amber-600">โหมดตัวอย่าง</span>}
          </p>
        </div>
        <NewProjectDialog teams={admin.teams} departmentOptions={config.departments} />
      </header>

      {/* KPI cards — เครื่องวัดหลักอ่านได้ในแวบเดียว (gradient icon tiles) */}
      <div className="animate-rise mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="กำลังทำ"
          value={active.length}
          unit="โปรเจกต์"
          gradient="from-indigo-500 to-blue-600"
          shadow="shadow-indigo-500/25"
          icon={
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          }
        />
        <Stat
          label="วันทำการรวม"
          value={activeWorkingDays}
          unit="วัน"
          gradient="from-sky-500 to-cyan-500"
          shadow="shadow-sky-500/25"
          icon={
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </>
          }
        />
        <Stat
          label="เกินกำหนด"
          value={overdue}
          unit="โปรเจกต์"
          gradient="from-rose-500 to-red-500"
          shadow="shadow-rose-500/25"
          alert={overdue > 0}
          icon={
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          }
        />
        <Stat
          label="ใกล้ครบกำหนด"
          value={atRisk}
          unit="โปรเจกต์"
          gradient="from-amber-400 to-orange-500"
          shadow="shadow-amber-500/25"
          alert={atRisk > 0}
          icon={
            <>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </>
          }
        />
      </div>

      <GanttChart projects={data.projects} />
    </main>
  )
}

/** การ์ดตัวเลขหลัก: ไอคอนบนไทล์ไล่เฉด + เลข mono ใหญ่ (แรงบันดาลใจ uiverse stat cards) */
function Stat({
  label,
  value,
  unit,
  gradient,
  shadow,
  icon,
  alert,
}: {
  label: string
  value: number
  unit: string
  gradient: string
  shadow: string
  icon: React.ReactNode
  alert?: boolean
}) {
  return (
    <div className="surface surface-hover flex items-center gap-3 rounded-2xl p-3.5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-inset ring-white/25 ${gradient} ${shadow}`}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <div className="min-w-0 leading-tight">
        <div className="flex items-baseline gap-1">
          <span className={`font-mono text-xl font-bold ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
          <span className="text-[10px] text-slate-400">{unit}</span>
        </div>
        <div className="truncate text-[11px] font-medium text-slate-500">{label}</div>
      </div>
    </div>
  )
}
