import { eachDayOfInterval, isWeekend, format } from 'date-fns'

/**
 * นับจำนวน "วันทำการ" ระหว่าง start..end (รวมปลายทั้งสอง)
 * ตัดเสาร์-อาทิตย์ และวันหยุดที่ระบุใน holidays (รูปแบบ 'YYYY-MM-DD')
 * คืน 0 ถ้า end < start หรือวันที่ไม่ถูกต้อง
 */
export function workingDaysBetween(start: string, end: string, holidays: string[] = []): number {
  if (!start || !end) return 0
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0
  const holidaySet = new Set(holidays)
  return eachDayOfInterval({ start: s, end: e }).filter(
    (d) => !isWeekend(d) && !holidaySet.has(format(d, 'yyyy-MM-dd')),
  ).length
}
