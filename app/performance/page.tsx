import { getPerformance } from '@/lib/data/performance'
import { Avatar } from '@/components/ui/Avatar'
import { STATUS_META } from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const { stats, projectNames } = await getPerformance()

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Individual Performance</h1>
        <p className="text-xs text-gray-500">สรุปผลงานรายบุคคลจากงานที่รับผิดชอบ (รวมทุกโปรเจกต์)</p>
      </header>

      {stats.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {stats.map((s) => (
            <div key={s.user.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <Avatar user={s.user} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{s.user.name}</div>
                  <div className="text-[11px] text-gray-400">{s.user.role} · {s.user.email}</div>
                </div>
              </div>

              {/* Metric grid */}
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="โปรเจกต์" value={s.projectCount} />
                <Metric label="งานที่รับ" value={s.taskTotal} />
                <Metric label="วันทำการ" value={s.workingDays} />
              </div>

              {/* Completion */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                  <span>ส่งงานสำเร็จ {s.taskDone}/{s.taskTotal}</span>
                  <span className="font-medium text-gray-700">{s.completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${s.completion}%` }} />
                </div>
              </div>

              {/* Status breakdown */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(['done', 'on-track', 'at-risk', 'overdue'] as const).map((k) =>
                  s.byStatus[k] > 0 ? (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: STATUS_META[k].bg, color: STATUS_META[k].fg }}
                    >
                      {STATUS_META[k].symbol} {STATUS_META[k].label} {s.byStatus[k]}
                    </span>
                  ) : null,
                )}
                {s.byStatus.overdue > 0 && (
                  <span className="inline-flex items-center rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    ⚠ ต้องเร่ง {s.byStatus.overdue}
                  </span>
                )}
              </div>

              {/* Project chips */}
              {s.projectIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.projectIds.map((pid) => (
                    <span key={pid} className="truncate rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500 ring-1 ring-gray-100">
                      {projectNames[pid] ?? pid}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 py-2">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400">{label}</div>
    </div>
  )
}
