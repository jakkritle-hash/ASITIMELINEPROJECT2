import { describe, it, expect } from 'vitest'
import { buildWeeks, heatLevel, monthsInRange, monthMatrix } from './heatmap'

describe('buildWeeks', () => {
  it('คืนสัปดาห์ละ 7 วันเสมอ และครอบคลุมช่วงที่ให้', () => {
    const weeks = buildWeeks('2026-01-01', '2026-01-31')
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    const flat = weeks.flat()
    expect(flat).toContain('2026-01-01')
    expect(flat).toContain('2026-01-31')
    // เริ่มต้นที่วันอาทิตย์ (2025-12-28 คืออาทิตย์ก่อน 1 ม.ค. 2026)
    expect(weeks[0][0]).toBe('2025-12-28')
  })
})

describe('monthsInRange', () => {
  it('ไล่เดือนคร่อมช่วง รวมข้ามปี', () => {
    const ms = monthsInRange('2025-11-15', '2026-02-03').map((m) => m.key)
    expect(ms).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })
})

describe('monthMatrix', () => {
  it('จันทร์เป็นวันแรก, สัปดาห์ละ 7 ช่อง, มี null เป็นช่องว่าง', () => {
    const weeks = monthMatrix(2026, 6) // กรกฎาคม 2026 — 1 ก.ค. คือวันพุธ
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    // จ อ พ → null,null,'2026-07-01'
    expect(weeks[0][0]).toBeNull()
    expect(weeks[0][2]).toBe('2026-07-01')
    expect(weeks.flat()).toContain('2026-07-31')
  })
})

describe('heatLevel', () => {
  it('0 เมื่อไม่มีกิจกรรมหรือ max=0', () => {
    expect(heatLevel(0, 10)).toBe(0)
    expect(heatLevel(5, 0)).toBe(0)
  })
  it('ไล่ระดับ 1–4 ตามสัดส่วนกับ max', () => {
    expect(heatLevel(1, 10)).toBe(1) // 0.1
    expect(heatLevel(3, 10)).toBe(2) // 0.3
    expect(heatLevel(6, 10)).toBe(3) // 0.6
    expect(heatLevel(10, 10)).toBe(4) // 1.0
  })
})
