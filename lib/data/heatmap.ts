import { format, subDays } from 'date-fns'
import type { User } from '@/lib/domain/types'
import { buildWeeks } from '@/lib/domain/heatmap'
import { getTabCached } from '@/lib/sheets/repository'
import { parseLog } from '@/lib/sheets/schema'
import { getAdminData } from './admin'
import { sheetsConfigured } from './dashboard'

const WEEKS_BACK = 18 // ~4 เดือนล่าสุด

export interface UserHeat {
  user: User
  counts: Record<string, number> // 'yyyy-MM-dd' → จำนวนการเคลื่อนไหว
  total: number
  max: number
}
export interface HeatmapData {
  weeks: string[][] // คอลัมน์ = สัปดาห์, 7 วันต่อสัปดาห์
  users: UserHeat[]
  startDate: string
  endDate: string
}

/** heatmap ความเคลื่อนไหวรายวันของแต่ละคน (จาก Activity Log) — ช่วง ~18 สัปดาห์ล่าสุด */
export async function getPerformanceHeatmaps(now: Date = new Date()): Promise<HeatmapData> {
  const endDate = format(now, 'yyyy-MM-dd')
  const startDate = format(subDays(now, WEEKS_BACK * 7 - 1), 'yyyy-MM-dd')
  const weeks = buildWeeks(startDate, endDate)

  const { users } = await getAdminData()
  const active = users.filter((u) => u.active)

  if (!sheetsConfigured()) {
    return { weeks, users: active.map((u) => ({ user: u, counts: {}, total: 0, max: 0 })), startDate, endDate }
  }

  const logs = (await getTabCached('ActivityLog')).map(parseLog)
  const byUser = new Map<string, Record<string, number>>()
  for (const l of logs) {
    if (!l.timestamp || !l.actorId) continue
    const d = l.timestamp.slice(0, 10) // วันที่จาก ISO timestamp
    if (d < startDate || d > endDate) continue
    const m = byUser.get(l.actorId) ?? {}
    m[d] = (m[d] ?? 0) + 1
    byUser.set(l.actorId, m)
  }

  const usersHeat: UserHeat[] = active.map((u) => {
    const counts = byUser.get(u.id) ?? {}
    const vals = Object.values(counts)
    return { user: u, counts, total: vals.reduce((a, b) => a + b, 0), max: vals.length ? Math.max(...vals) : 0 }
  })
  // เรียงคนที่มีความเคลื่อนไหวมากไว้บน
  usersHeat.sort((a, b) => b.total - a.total)

  return { weeks, users: usersHeat, startDate, endDate }
}
