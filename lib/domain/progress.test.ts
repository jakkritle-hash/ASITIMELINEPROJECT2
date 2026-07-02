import { describe, it, expect } from 'vitest'
import { projectProgress, isProjectComplete } from './progress'

const t = (columnStatus: string) => ({ columnStatus })

describe('projectProgress', () => {
  it('ไม่มี task = 0%', () => {
    expect(projectProgress([])).toBe(0)
  })
  it('2 ใน 4 Done = 50%', () => {
    expect(projectProgress([t('Done'), t('Done'), t('To Do'), t('In Progress')])).toBe(50)
  })
  it('ทุกตัว Done = 100%', () => {
    expect(projectProgress([t('Done'), t('done')])).toBe(100)
  })
  it('ปัดเศษ: 1 ใน 3 = 33%', () => {
    expect(projectProgress([t('Done'), t('To Do'), t('Pending')])).toBe(33)
  })
})

describe('isProjectComplete', () => {
  it('ว่าง = ไม่เสร็จ', () => {
    expect(isProjectComplete([])).toBe(false)
  })
  it('ทุกตัว Done = เสร็จ', () => {
    expect(isProjectComplete([t('Done'), t('Done')])).toBe(true)
  })
  it('ยังมีค้าง = ไม่เสร็จ', () => {
    expect(isProjectComplete([t('Done'), t('Review')])).toBe(false)
  })
})
