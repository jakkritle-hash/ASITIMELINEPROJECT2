import { describe, it, expect } from 'vitest'
import { workingDaysBetween } from './workingDays'

describe('workingDaysBetween', () => {
  it('วันเดียว (จ.) = 1', () => {
    expect(workingDaysBetween('2026-07-06', '2026-07-06')).toBe(1) // จันทร์
  })
  it('ตัดเสาร์-อาทิตย์: จ.6 ก.ค. ถึง ศ.10 ก.ค. = 5', () => {
    expect(workingDaysBetween('2026-07-06', '2026-07-10')).toBe(5)
  })
  it('ครอบสุดสัปดาห์: จ.6 ถึง จ.13 ก.ค. = 6 (ตัด ส.11/อา.12)', () => {
    expect(workingDaysBetween('2026-07-06', '2026-07-13')).toBe(6)
  })
  it('เสาร์-อาทิตย์ล้วน = 0', () => {
    expect(workingDaysBetween('2026-07-11', '2026-07-12')).toBe(0)
  })
  it('ตัดวันหยุดไทยด้วย: คร่อม 28 ก.ค. (วันหยุด) จ.27-พ.29 = 2 (ตัด 28)', () => {
    expect(workingDaysBetween('2026-07-27', '2026-07-29', ['2026-07-28'])).toBe(2)
  })
  it('end < start = 0', () => {
    expect(workingDaysBetween('2026-07-10', '2026-07-06')).toBe(0)
  })
})
