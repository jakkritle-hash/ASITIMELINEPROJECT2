import { describe, it, expect } from 'vitest'
import { presenceState } from './presence'

const NOW = Date.parse('2026-07-07T10:00:00.000Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

describe('presenceState', () => {
  it('active: heartbeat + active สดทั้งคู่', () => {
    expect(presenceState(ago(10_000), ago(10_000), NOW)).toBe('active')
  })
  it('idle: heartbeat สด แต่ไม่ได้ active มานาน', () => {
    expect(presenceState(ago(30_000), ago(120_000), NOW)).toBe('idle')
  })
  it('idle: heartbeat สด แต่ไม่มี lastActiveAt เลย', () => {
    expect(presenceState(ago(30_000), '', NOW)).toBe('idle')
  })
  it('offline: heartbeat เก่าเกิน', () => {
    expect(presenceState(ago(300_000), ago(300_000), NOW)).toBe('offline')
  })
  it('offline: ไม่มีข้อมูล', () => {
    expect(presenceState('', '', NOW)).toBe('offline')
    expect(presenceState(undefined, undefined, NOW)).toBe('offline')
  })
})
