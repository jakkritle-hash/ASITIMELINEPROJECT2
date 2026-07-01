import { describe, it, expect } from 'vitest'
import { computeSlaStatus } from './sla'

const TZ = 'Asia/Bangkok'
// อ้างอิง "วันนี้" = 2026-07-01 เพื่อผลลัพธ์คงที่
const today = new Date('2026-07-01T03:00:00Z') // 10:00 ตามเวลาไทย

describe('computeSlaStatus', () => {
  it('คืน done เมื่อ isDone = true ไม่ว่ากำหนดจะเป็นอย่างไร', () => {
    expect(computeSlaStatus({ dueDate: '2026-06-01', isDone: true, now: today, tz: TZ, atRiskDays: 2 })).toBe('done')
  })

  it('คืน overdue เมื่อเลย dueDate และยังไม่เสร็จ', () => {
    expect(computeSlaStatus({ dueDate: '2026-06-30', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('overdue')
  })

  it('คืน at-risk เมื่อเหลือ <= atRiskDays วัน', () => {
    expect(computeSlaStatus({ dueDate: '2026-07-03', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('at-risk')
  })

  it('คืน on-track เมื่อยังเหลือเวลามากกว่า atRiskDays', () => {
    expect(computeSlaStatus({ dueDate: '2026-07-20', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('on-track')
  })

  it('วันครบกำหนดวันนี้พอดี = at-risk (ยังไม่เกิน)', () => {
    expect(computeSlaStatus({ dueDate: '2026-07-01', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('at-risk')
  })
})
