import { describe, it, expect } from 'vitest'
import { buildWeeks, heatLevel } from './heatmap'

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
