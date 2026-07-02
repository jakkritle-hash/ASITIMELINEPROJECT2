import { getPerformance } from '@/lib/data/performance'
import { Avatar } from '@/components/ui/Avatar'
import { STATUS_META } from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

/** เหรียญตามอันดับ — แชมป์ 3 อันดับแรกได้ 🏆🥈🥉 ที่เหลือเป็นเลขอันดับ */
const MEDALS: Record<number, { icon: string; label: string; ring: string; badge: string }> = {
  1: { icon: '🏆', label: 'Champion', ring: 'ring-2 ring-amber-400', badge: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' },
  2: { icon: '🥈', label: 'Runner-up', ring: 'ring-1 ring-slate-300', badge: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' },
  3: { icon: '🥉', label: '3rd', ring: 'ring-1 ring-orange-300', badge: 'bg-gradient-to-br from-orange-300 to-amber-600 text-white' },
}

export default async function PerformancePage() {
  const { stats, projectNames } = await getPerformance()

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Individual Performance</h1>
        <p className="text-xs text-gray-500">
          จัดอันดับผลงานรายบุคคล 🏆 — คะแนน = งานที่ส่งสำเร็จ ×10 + อัตราสำเร็จ% ×0.5 + วันทำการ − งานเลยกำหนด ×8
        </p>
      </header>

      {stats.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {stats.map((s) => {
            const medal = MEDALS[s.rank]
            return (
            <div
              key={s.user.id}
              className={`relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 ${medal?.ring ?? ''}`}
            >
              {/* Rank badge (มุมขวาบน) */}
              <div className="absolute right-3 top-3 flex items-center gap-1.5">
                {medal && <span className="text-lg leading-none" title={medal.label}>{medal.icon}</span>}
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${medal?.badge ?? 'bg-gray-100 text-gray-500'}`}
                  title={`อันดับ ${s.rank}`}
                >
                  #{s.rank}
                </span>
              </div>

              {/* Header */}
              <div className="mb-4 flex items-center gap-3 pr-16">
                <Avatar user={s.user} size={40} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-gray-900">{s.user.name}</span>
                    {s.rank === 1 && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                        Champion
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400">{s.user.role} · <span className="font-medium text-gray-500">score {s.score}</span></div>
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
            )
          })}
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
