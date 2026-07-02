import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  eachDayOfInterval,
  startOfMonth,
  addMonths,
  startOfQuarter,
  addQuarters,
  startOfYear,
  addYears,
  startOfWeek,
  addWeeks,
  addDays,
  getQuarter,
  getISOWeek,
} from 'date-fns'
import type { DateRange } from './ganttGeometry'
import type { TimeLayer } from './timeLayers'

export interface HeaderSegment {
  label: string
  leftPct: number
  widthPct: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** ตำแหน่ง % ของวันหนึ่งเทียบช่วงรวม (clamp 0–100) */
function pointPct(date: Date, range: DateRange): number {
  const total = Math.max(1, differenceInCalendarDays(new Date(range.end), new Date(range.start)))
  const offset = differenceInCalendarDays(date, new Date(range.start))
  return Math.min(100, Math.max(0, (offset / total) * 100))
}

/** สร้าง segment ทั่วไปจากขอบเขตย่อยแต่ละหน่วย */
function buildSegments(
  starts: Date[],
  nextBoundary: (d: Date) => Date,
  label: (d: Date) => string,
  range: DateRange,
): HeaderSegment[] {
  return starts.map((d) => {
    const left = pointPct(d, range)
    const right = pointPct(nextBoundary(d), range)
    return { label: label(d), leftPct: left, widthPct: Math.max(0, right - left) }
  })
}

export function yearSegments(range: DateRange): HeaderSegment[] {
  const s = new Date(range.start)
  const e = new Date(range.end)
  return buildSegments(eachYearOfInterval({ start: s, end: e }).map((d) => startOfYear(d)), (d) => addYears(d, 1), (d) => `${d.getFullYear()}`, range)
}

export function quarterSegments(range: DateRange): HeaderSegment[] {
  const s = new Date(range.start)
  const e = new Date(range.end)
  return buildSegments(eachQuarterOfInterval({ start: s, end: e }).map((d) => startOfQuarter(d)), (d) => addQuarters(d, 1), (d) => `Q${getQuarter(d)}`, range)
}

export function monthSegments(range: DateRange): HeaderSegment[] {
  const s = new Date(range.start)
  const e = new Date(range.end)
  return buildSegments(
    eachMonthOfInterval({ start: s, end: e }).map((d) => startOfMonth(d)),
    (d) => addMonths(d, 1),
    (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    range,
  )
}

export function weekSegments(range: DateRange): HeaderSegment[] {
  const s = new Date(range.start)
  const e = new Date(range.end)
  return buildSegments(
    eachWeekOfInterval({ start: s, end: e }, { weekStartsOn: 1 }).map((d) => startOfWeek(d, { weekStartsOn: 1 })),
    (d) => addWeeks(d, 1),
    (d) => `W${getISOWeek(d)}`,
    range,
  )
}

export function daySegments(range: DateRange): HeaderSegment[] {
  const s = new Date(range.start)
  const e = new Date(range.end)
  return buildSegments(eachDayOfInterval({ start: s, end: e }), (d) => addDays(d, 1), (d) => `${d.getDate()}`, range)
}

export function segmentsForLayer(layer: TimeLayer, range: DateRange): HeaderSegment[] {
  switch (layer) {
    case 'year':
      return yearSegments(range)
    case 'quarter':
      return quarterSegments(range)
    case 'month':
      return monthSegments(range)
    case 'week':
      return weekSegments(range)
    case 'day':
      return daySegments(range)
  }
}
