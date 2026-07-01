import { differenceInCalendarDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { SlaStatus } from './types'

export interface SlaInput {
  dueDate: string // YYYY-MM-DD
  isDone: boolean
  now: Date
  tz: string
  atRiskDays: number
}

/**
 * คำนวณสถานะ SLA โดยเทียบเป็น "วันตามปฏิทิน" ในเขตเวลาที่กำหนด
 * (เปลี่ยนเป็นวันทำงานได้โดยแก้เฉพาะการนับ daysLeft ในฟังก์ชันนี้)
 */
export function computeSlaStatus(input: SlaInput): SlaStatus {
  if (input.isDone) return 'done'
  const nowLocal = toZonedTime(input.now, input.tz)
  const dueLocal = toZonedTime(new Date(input.dueDate + 'T00:00:00'), input.tz)
  const daysLeft = differenceInCalendarDays(dueLocal, nowLocal)
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= input.atRiskDays) return 'at-risk'
  return 'on-track'
}
