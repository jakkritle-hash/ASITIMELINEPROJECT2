import { getTabCached } from '@/lib/sheets/repository'
import { parseLog } from '@/lib/sheets/schema'
import { getDashboardData, sheetsConfigured } from './dashboard'
import { getAdminData } from './admin'

export interface NotificationItem {
  id: string
  kind: 'activity' | 'overdue' | 'at-risk'
  text: string
  timestamp?: string
  href?: string
}

const ACTION_TH: Record<string, string> = { create: 'สร้าง', update: 'แก้ไข', move: 'ย้าย', delete: 'ลบ' }
const FIELD_TH: Record<string, string> = {
  title: 'ชื่องาน', description: 'รายละเอียด', assigneeId: 'ผู้รับผิดชอบ',
  startDate: 'วันเริ่ม', dueDate: 'วันครบกำหนด', columnStatus: 'สถานะ',
}

/** รวมการแจ้งเตือน: งานเกินกำหนด/ใกล้ครบ + การแก้ไขล่าสุด */
export async function getNotifications(): Promise<{ items: NotificationItem[]; unread: number }> {
  const data = await getDashboardData()
  const items: NotificationItem[] = []

  // SLA alerts (ข้ามโปรเจกต์ที่เก็บถาวรแล้ว)
  for (const p of data.projects) {
    if (p.archived) continue
    for (const t of p.tasks) {
      if (t.slaStatus === 'overdue') {
        items.push({ id: `sla-${t.id}`, kind: 'overdue', text: `เกินกำหนด: ${t.title} (${p.name})`, href: `/projects/${p.id}` })
      } else if (t.slaStatus === 'at-risk') {
        items.push({ id: `sla-${t.id}`, kind: 'at-risk', text: `ใกล้ครบกำหนด: ${t.title} — ครบ ${t.dueDate}`, href: `/projects/${p.id}` })
      }
    }
  }

  // Activity (การแก้ไขล่าสุด) — เฉพาะเมื่อต่อ Sheet จริง
  if (sheetsConfigured()) {
    const [{ users }, logs] = await Promise.all([getAdminData(), getTabCached('ActivityLog').then((r) => r.map(parseLog))])
    const userName = (id: string) => users.find((u) => u.id === id)?.name ?? 'บางคน'
    const taskTitle = new Map(data.projects.flatMap((p) => p.tasks.map((t) => [t.id, { title: t.title, pid: p.id }])))
    const recent = [...logs].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 12)
    for (const l of recent) {
      const info = taskTitle.get(l.entityId)
      const field = FIELD_TH[l.field] ?? l.field
      items.push({
        id: `log-${l.id}`,
        kind: 'activity',
        text: `${userName(l.actorId)} ${ACTION_TH[l.action] ?? l.action}${info ? ' ' + field + ' ของ "' + info.title + '"' : ''}`,
        timestamp: l.timestamp,
        href: info ? `/projects/${info.pid}` : undefined,
      })
    }
  }

  // unread = งานเกินกำหนด/ใกล้ครบ + กิจกรรมใน 24 ชม.ล่าสุด
  const since = Date.now() - 24 * 60 * 60 * 1000
  const unread =
    items.filter((i) => i.kind !== 'activity').length +
    items.filter((i) => i.kind === 'activity' && i.timestamp && new Date(i.timestamp).getTime() > since).length

  return { items, unread }
}
