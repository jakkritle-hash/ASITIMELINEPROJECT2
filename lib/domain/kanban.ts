import type { Task } from './types'

/** จัดกลุ่ม task ตามคอลัมน์ (คอลัมน์ที่กำหนดจะมีเสมอแม้ว่าง) เรียงตาม order */
export function groupByColumn(tasks: Task[], columns: string[]): Record<string, Task[]> {
  const g: Record<string, Task[]> = {}
  for (const c of columns) g[c] = []
  for (const t of tasks) {
    if (!g[t.columnStatus]) g[t.columnStatus] = []
    g[t.columnStatus].push(t)
  }
  for (const c of Object.keys(g)) g[c].sort((a, b) => a.order - b.order)
  return g
}

/** ย้าย task ไปยังคอลัมน์ปลายทาง (คืน array ใหม่ ไม่แตะ task อื่น) */
export function moveTask(tasks: Task[], taskId: string, toColumn: string): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, columnStatus: toColumn } : t))
}
