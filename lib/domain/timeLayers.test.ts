import { describe, it, expect } from 'vitest'
import { layersForZoom, ZOOM_LEVELS } from './timeLayers'

describe('layersForZoom', () => {
  it('มีระดับซูมครบ 5 ระดับ', () => {
    expect(ZOOM_LEVELS).toEqual(['year', 'quarter', 'month', 'week', 'day'])
  })
  it('ปี → [ปี, ไตรมาส]', () => {
    expect(layersForZoom('year')).toEqual(['year', 'quarter'])
  })
  it('ไตรมาส → [ไตรมาส, เดือน]', () => {
    expect(layersForZoom('quarter')).toEqual(['quarter', 'month'])
  })
  it('เดือน → [เดือน, สัปดาห์]', () => {
    expect(layersForZoom('month')).toEqual(['month', 'week'])
  })
  it('สัปดาห์ → [สัปดาห์, วัน]', () => {
    expect(layersForZoom('week')).toEqual(['week', 'day'])
  })
  it('วัน → [เดือน, สัปดาห์, วัน]', () => {
    expect(layersForZoom('day')).toEqual(['month', 'week', 'day'])
  })
})
