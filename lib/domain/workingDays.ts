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

/**
 * จำนวน "วันทำการที่ล่าช้า" เทียบกับวันครบกำหนด
 * - งานที่ปิดแล้ว: ใช้วันปิด (completedAt); งานที่ยังไม่ปิด: ใช้วันนี้ (today) → ยิ่งดองยิ่งเพิ่ม
 * - คืน 0 ถ้าไม่เลยกำหนด / ข้อมูลไม่ครบ (นับเฉพาะวันทำการหลังวันครบกำหนด)
 */
export function lateWorkingDays(dueDate: string, refDate: string, holidays: string[] = []): number {
  if (!dueDate || !refDate || refDate <= dueDate) return 0
  // นับวันทำการช่วง (วันถัดจากครบกำหนด .. วันอ้างอิง) — ตัดวันครบกำหนดออก
  return Math.max(0, workingDaysBetween(dueDate, refDate, holidays) - 1)
}
