import { eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getDay, format } from 'date-fns'

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

export interface MonthKey {
  year: number
  month0: number // 0–11
  key: string // 'YYYY-MM'
}

/** รายชื่อเดือน (ปี+เดือน) ที่คร่อมช่วง start–end แบบเรียงเวลา */
export function monthsInRange(startISO: string, endISO: string): MonthKey[] {
  const s = new Date(startISO + 'T00:00:00')
  const e = new Date(endISO + 'T00:00:00')
  const out: MonthKey[] = []
  let y = s.getFullYear()
  let m = s.getMonth()
  while (y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth())) {
    out.push({ year: y, month0: m, key: `${y}-${String(m + 1).padStart(2, '0')}` })
    m++
    if (m > 11) { m = 0; y++ }
  }
  return out
}

/**
 * ตารางปฏิทินของเดือน (จันทร์เป็นวันแรก) — คืนสัปดาห์ละ 7 ช่อง
 * ช่องที่เป็น null = ช่องว่างก่อนวันที่ 1 / หลังวันสุดท้าย เพื่อจัดให้ตรงคอลัมน์วัน
 */
export function monthMatrix(year: number, month0: number): (string | null)[][] {
  const first = new Date(year, month0, 1)
  const days = eachDayOfInterval({ start: startOfMonth(first), end: endOfMonth(first) })
  const lead = (getDay(first) + 6) % 7 // แปลงให้จันทร์ = 0
  const cells: (string | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (const d of days) cells.push(format(d, 'yyyy-MM-dd'))
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
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
