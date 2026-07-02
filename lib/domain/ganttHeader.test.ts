import { describe, it, expect } from 'vitest'
import { monthSegments, segmentsForLayer } from './ganttHeader'

describe('monthSegments', () => {
  it('แบ่งช่วงเป็นเดือน พร้อม label และความกว้าง %', () => {
    const segs = monthSegments({ start: '2026-07-01', end: '2026-09-01' })
    expect(segs.map((s) => s.label)).toEqual(['Jul 2026', 'Aug 2026', 'Sep 2026'])
    const totalWidth = segs.reduce((a, s) => a + s.widthPct, 0)
    expect(totalWidth).toBeCloseTo(100, 0)
  })
})

describe('segmentsForLayer', () => {
  it('ชั้นวันคืนจำนวน segment ตามจำนวนวัน', () => {
    const segs = segmentsForLayer('day', { start: '2026-07-01', end: '2026-07-05' })
    expect(segs.map((s) => s.label)).toEqual(['1', '2', '3', '4', '5'])
  })
  it('ชั้นไตรมาสมี label รูปแบบ Qn', () => {
    const segs = segmentsForLayer('quarter', { start: '2026-01-01', end: '2026-12-31' })
    expect(segs[0].label).toBe('Q1')
  })
})
