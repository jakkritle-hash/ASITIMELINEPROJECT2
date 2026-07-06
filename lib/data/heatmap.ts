import { eachDayOfInterval, format } from 'date-fns'
import type { User } from '@/lib/domain/types'
import { buildWeeks } from '@/lib/domain/heatmap'
import { getDashboardData } from './dashboard'
import { getAdminData } from './admin'

export interface UserHeat {
  user: User
  counts: Record<string, number> // 'yyyy-MM-dd' → จำนวนงานที่รับผิดชอบและยัง active วันนั้น
  titles: Record<string, string[]> // ชื่องานต่อวัน (ใช้แสดงใน tooltip)
  total: number // รวม task-days (ใช้เรียงลำดับ)
  peak: number // จำนวนงานพร้อมกันสูงสุด
}
export interface HeatmapData {
  weeks: string[][]
  users: UserHeat[]
  startDate: string
  endDate: string
  today: string
  globalMax: number // สเกลสีร่วม เพื่อเทียบภาระงานข้ามคนได้
}

/** heatmap ภาระงานรายบุคคล — แต่ละวันนับงานที่ผู้นั้นรับผิดชอบและช่วง (เริ่ม–ครบกำหนด) คร่อมวันนั้น
 *  ช่วงเวลา = ตั้งแต่วันเริ่มงานแรกสุดถึงวันครบกำหนดท้ายสุด (เห็นทั้งอดีตและอนาคต) */
export async function getWorkloadHeatmaps(now: Date = new Date()): Promise<HeatmapData> {
  const [data, admin] = await Promise.all([getDashboardData(now), getAdminData()])
  const active = admin.users.filter((u) => u.active)
  const tasks = data.projects.flatMap((p) => p.tasks) // enriched: assigneeId, title, startDate, dueDate

  const today = format(now, 'yyyy-MM-dd')
  const starts = tasks.map((t) => t.startDate).filter(Boolean)
  const dues = tasks.map((t) => t.dueDate).filter(Boolean)
  const startDate = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : today
  let endDate = dues.length ? dues.reduce((a, b) => (a > b ? a : b)) : today
  if (endDate < startDate) endDate = startDate
  const weeks = buildWeeks(startDate, endDate)

  const perUser = new Map<string, { counts: Record<string, number>; titles: Record<string, string[]> }>()
  for (const u of active) perUser.set(u.id, { counts: {}, titles: {} })

  for (const t of tasks) {
    const bucket = perUser.get(t.assigneeId)
    if (!bucket || !t.startDate || !t.dueDate) continue
    const s = new Date(t.startDate + 'T00:00:00')
    const e = new Date(t.dueDate + 'T00:00:00')
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) continue
    for (const day of eachDayOfInterval({ start: s, end: e })) {
      const key = format(day, 'yyyy-MM-dd')
      bucket.counts[key] = (bucket.counts[key] ?? 0) + 1
      ;(bucket.titles[key] ??= []).push(t.title)
    }
  }

  let globalMax = 0
  const users: UserHeat[] = active.map((u) => {
    const b = perUser.get(u.id)!
    const vals = Object.values(b.counts)
    const peak = vals.length ? Math.max(...vals) : 0
    globalMax = Math.max(globalMax, peak)
    return { user: u, counts: b.counts, titles: b.titles, total: vals.reduce((a, c) => a + c, 0), peak }
  })
  users.sort((a, b) => b.total - a.total) // คนที่ภาระงานรวมมากไว้บน

  return { weeks, users, startDate, endDate, today, globalMax: Math.max(1, globalMax) }
}
