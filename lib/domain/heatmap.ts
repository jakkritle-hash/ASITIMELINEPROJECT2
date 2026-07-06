import { eachDayOfInterval, startOfWeek, endOfWeek, format } from 'date-fns'

/**
 * แบ่งช่วงวันเป็น "สัปดาห์" (คอลัมน์) แบบปฏิทิน heatmap
 * ขยายช่วงให้เต็มสัปดาห์ (อาทิตย์→เสาร์) แล้ว chunk ทีละ 7 วัน
 * คืนอาร์เรย์ของสัปดาห์ แต่ละสัปดาห์เป็น 7 วันรูปแบบ 'yyyy-MM-dd'
 */
export function buildWeeks(startISO: string, endISO: string): string[][] {
  const start = startOfWeek(new Date(startISO + 'T00:00:00'), { weekStartsOn: 0 })
  const end = endOfWeek(new Date(endISO + 'T00:00:00'), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

/** ระดับความเข้มของสี (0–4) ตามสัดส่วนกับค่าสูงสุดของบุคคลนั้น */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0
  const r = count / max
  if (r > 0.75) return 4
  if (r > 0.5) return 3
  if (r > 0.25) return 2
  return 1
}
