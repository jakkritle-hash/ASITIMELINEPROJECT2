import { describe, it, expect } from 'vitest'
import { barMetrics, timelineRange } from './ganttGeometry'

describe('timelineRange', () => {
  it('คืนช่วงครอบคลุมทุกวันที่ (min start, max due)', () => {
    const r = timelineRange([
      { startDate: '2026-07-01', dueDate: '2026-07-10' },
      { startDate: '2026-07-05', dueDate: '2026-08-01' },
    ])
    expect(r?.start).toBe('2026-07-01')
    expect(r?.end).toBe('2026-08-01')
  })
  it('ช่วงว่าง = คืน null', () => {
    expect(timelineRange([])).toBeNull()
  })
})

describe('barMetrics', () => {
  const range = { start: '2026-07-01', end: '2026-07-11' } // 10 วัน
  it('แท่งที่เริ่มต้นช่วงพอดี left=0', () => {
    const m = barMetrics('2026-07-01', '2026-07-02', range)
    expect(m.leftPct).toBeCloseTo(0, 5)
  })
  it('ความกว้าง = สัดส่วนจำนวนวันต่อช่วงรวม', () => {
    const m = barMetrics('2026-07-01', '2026-07-06', range)
    expect(m.widthPct).toBeCloseTo(50, 5)
  })
  it('clamp ไม่ให้เกิน 100%', () => {
    const m = barMetrics('2026-07-06', '2026-07-31', range)
    expect(m.leftPct + m.widthPct).toBeLessThanOrEqual(100.0001)
  })
})
