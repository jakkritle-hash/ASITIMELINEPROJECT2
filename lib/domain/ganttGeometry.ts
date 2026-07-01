import { differenceInCalendarDays } from 'date-fns'

export interface DateRange {
  start: string
  end: string
}

/** คืนช่วงเวลาที่ครอบคลุมทุกวันที่ (วันเริ่มเร็วสุด → วันครบช้าสุด); คืน null ถ้าไม่มีข้อมูล */
export function timelineRange(items: { startDate: string; dueDate: string }[]): DateRange | null {
  const dates = items.flatMap((i) => [i.startDate, i.dueDate]).filter(Boolean)
  if (dates.length === 0) return null
  const sorted = [...dates].sort()
  return { start: sorted[0], end: sorted[sorted.length - 1] }
}

/** คำนวณตำแหน่งซ้าย (%) และความกว้าง (%) ของแท่งเทียบกับช่วงเวลารวม (clamp ไว้ใน 0–100) */
export function barMetrics(start: string, due: string, range: DateRange): { leftPct: number; widthPct: number } {
  const total = Math.max(1, differenceInCalendarDays(new Date(range.end), new Date(range.start)))
  const offset = differenceInCalendarDays(new Date(start), new Date(range.start))
  const span = Math.max(1, differenceInCalendarDays(new Date(due), new Date(start)))
  let leftPct = (offset / total) * 100
  let widthPct = (span / total) * 100
  if (leftPct < 0) {
    widthPct += leftPct
    leftPct = 0
  }
  if (leftPct + widthPct > 100) widthPct = 100 - leftPct
  return { leftPct, widthPct: Math.max(0, widthPct) }
}
