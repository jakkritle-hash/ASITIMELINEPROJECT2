import { format } from 'date-fns'
import type { HeatmapData } from '@/lib/data/heatmap'
import { heatLevel } from '@/lib/domain/heatmap'
import { Avatar } from '@/components/ui/Avatar'

// ระดับ 0–4 → เฉดสี indigo (0 = ว่าง)
const LEVEL_BG = ['bg-gray-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-700']

function monthLabels(weeks: string[][]): string[] {
  let prev = ''
  return weeks.map((w) => {
    const m = format(new Date(w[0] + 'T00:00:00'), 'MMM')
    if (m !== prev) { prev = m; return m }
    return ''
  })
}

/** ปฏิทิน heatmap ความเคลื่อนไหวรายบุคคล (สไตล์ GitHub contributions) */
export function ActivityHeatmap({ data }: { data: HeatmapData }) {
  const labels = monthLabels(data.weeks)

  return (
    <section className="animate-rise mt-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
        ปฏิทินความเคลื่อนไหวรายบุคคล
      </h2>
      <p className="mb-3 text-xs text-gray-500">
        จำนวนการเคลื่อนไหว (สร้าง/แก้ไข/ย้าย/ลบงาน) ต่อวันในช่วง ~18 สัปดาห์ล่าสุด · ยิ่งเข้มยิ่งเยอะ
      </p>

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="min-w-max">
          {/* แถวป้ายเดือน */}
          <div className="mb-1 flex">
            <div className="w-40 shrink-0" />
            <div className="flex gap-[3px]">
              {data.weeks.map((_, i) => (
                <div key={i} className="w-3 shrink-0 whitespace-nowrap text-[9px] text-gray-400">{labels[i]}</div>
              ))}
            </div>
          </div>

          {data.users.length === 0 && <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>}

          {data.users.map((uh) => (
            <div key={uh.user.id} className="flex items-center gap-3 border-t border-gray-50 py-1.5 first:border-0">
              <div className="flex w-40 shrink-0 items-center gap-2">
                <Avatar user={uh.user} size={22} />
                <span className="truncate text-xs font-medium text-gray-700" title={uh.user.name}>{uh.user.name}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-gray-400" title="รวมทั้งช่วง">{uh.total}</span>
              </div>
              <div className="flex gap-[3px]">
                {data.weeks.map((week, wi) => (
                  <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                    {week.map((date) => {
                      const c = uh.counts[date] ?? 0
                      const future = date > data.endDate
                      const lvl = heatLevel(c, uh.max)
                      return (
                        <span
                          key={date}
                          title={future ? date : `${date} · ${c} การเคลื่อนไหว`}
                          className={`h-3 w-3 rounded-sm ${future ? 'bg-transparent' : LEVEL_BG[lvl]}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* legend */}
          <div className="mt-3 flex items-center gap-1.5 pl-40 text-[10px] text-gray-400">
            <span>น้อย</span>
            {LEVEL_BG.map((bg, i) => <span key={i} className={`h-3 w-3 rounded-sm ${bg}`} />)}
            <span>มาก</span>
          </div>
        </div>
      </div>
    </section>
  )
}
