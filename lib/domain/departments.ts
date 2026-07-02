/**
 * รายชื่อ Department ขององค์กร — แหล่งความจริงเดียว (single source of truth)
 * ใช้ในหน้า New Project (เลือกได้หลายแผนก) และแก้ไขได้ทุกเมื่อในหน้า Project
 *
 * แก้ไข/เพิ่ม/ลบ รายชื่อแผนกได้ที่นี่ที่เดียว แล้วมีผลทั้งเว็บ
 */
export const DEPARTMENTS = [
  'Digital',
  'Billboard',
  'Airport',
  '7-Eleven',
  'Static',
  'BUS',
  'Production',
  'OI',
  'Construction',
  'Store',
] as const

export type Department = (typeof DEPARTMENTS)[number]

/**
 * กรองเฉพาะแผนกที่อยู่ในลิสต์ที่อนุญาต + ตัดซ้ำ + คงลำดับตามลิสต์ที่อนุญาต
 * @param allowed รายการแผนกที่ใช้ได้จริง (จาก Config) — ค่าเริ่มต้น = DEPARTMENTS คงที่
 */
export function sanitizeDepartments(input: string[], allowed: readonly string[] = DEPARTMENTS): string[] {
  const set = new Set(input)
  return allowed.filter((d) => set.has(d))
}
