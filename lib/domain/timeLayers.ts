export const ZOOM_LEVELS = ['year', 'quarter', 'month', 'week', 'day'] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]
export type TimeLayer = 'year' | 'quarter' | 'month' | 'week' | 'day'

const RULES: Record<ZoomLevel, TimeLayer[]> = {
  year: ['year', 'quarter'],
  quarter: ['quarter', 'month'],
  month: ['month', 'week'],
  week: ['week', 'day'],
  day: ['month', 'week', 'day'],
}

/** คืนชั้นเวลาที่ต้องแสดงบนหัวตาราง Gantt ตามระดับซูม (ทุกชั้นมีครบ แค่เลือกแสดงตามระดับ) */
export function layersForZoom(zoom: ZoomLevel): TimeLayer[] {
  return RULES[zoom]
}
