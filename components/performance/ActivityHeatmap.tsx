import { format } from 'date-fns'
import type { HeatmapData } from '@/lib/data/heatmap'
import { heatLevel } from '@/lib/domain/heatmap'
import { Avatar } from '@/components/ui/Avatar'

// ระดับ 0–4 → เฉดสี indigo (0 = ไม่มีงานวันนั้น = ว่าง)
const LEVEL_BG = ['bg-gray-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-700']

function monthLabels(weeks: string[][]): string[] {
  let prev = ''
  return weeks.map((w) => {
    const m = format(new Date(w[0] + 'T00:00:00'), 'MMM')
    if (m !== prev) { prev = m; return m }
    return ''
  })
}

function tooltip(date: string, count: number, titles?: string[]): string {
  if (count === 0) return `${date} · ว่าง`
  const head = `${date} · ${count} งาน`
  if (!titles || titles.length === 0) return head
  const shown = titles.slice(0, 6).map((t) => `• ${t}`).join('\n')
  const more = titles.length > 6 ? `\n…และอีก ${titles.length - 6}` : ''
  return `${head}\n${shown}${more}`
}

/** ปฏิทินภาระงานรายบุคคล — ดูว่าใครยุ่ง/ว่างช่วงไหน (นับงานที่รับผิดชอบต่อวัน) */
export function ActivityHeatmap({ data }: { data: HeatmapData }) {
  const labels = monthLabels(data.weeks)

  return (
    <section className="animate-rise mt-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
        ปฏิทินภาระงานรายบุคคล
      </h2>
      <p className="mb-3 text-xs text-gray-500">
        จำนวนงานที่แต่ละคนรับผิดชอบในแต่ละวัน (ช่วงเริ่ม–ครบกำหนดคร่อมวันนั้น) · ยิ่งเข้ม = งานยิ่งเยอะ · ช่องจาง/ว่าง = ช่วงว่าง · hover เพื่อดูชื่องาน
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
                <span className="ml-auto shrink-0 font-mono text-[10px] text-gray-400" title="งานพร้อมกันสูงสุด">▲{uh.peak}</span>
              </div>
              <div className="flex gap-[3px]">
                {data.weeks.map((week, wi) => (
                  <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                    {week.map((date) => {
                      const inRange = date >= data.startDate && date <= data.endDate
                      const c = uh.counts[date] ?? 0
                      const lvl = heatLevel(c, data.globalMax)
                      const isToday = date === data.today
                      return (
                        <span
                          key={date}
                          title={inRange ? tooltip(date, c, uh.titles[date]) : date}
                          className={
                            `h-3 w-3 rounded-sm ${inRange ? LEVEL_BG[lvl] : 'bg-transparent'} ` +
                            (isToday ? 'ring-1 ring-rose-400' : '')
                          }
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
            <span>ว่าง</span>
            {LEVEL_BG.map((bg, i) => <span key={i} className={`h-3 w-3 rounded-sm ${bg}`} />)}
            <span>งานเยอะ</span>
            <span className="ml-3 inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm ring-1 ring-rose-400" /> วันนี้</span>
          </div>
        </div>
      </div>
    </section>
  )
}
