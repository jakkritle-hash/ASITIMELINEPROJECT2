# Phase 3: Kanban + Task Detail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** คลิกโปรเจกต์จาก Gantt → หน้า Kanban board (ลากการ์ดข้ามคอลัมน์), คลิกการ์ด → Task detail (แก้ไข → editCount+1) + Activity Log

**Architecture:** Logic จัดกลุ่ม/ย้ายการ์ด/นับ edit/สร้าง log เป็นฟังก์ชันบริสุทธิ์ใน `lib/domain/kanban.ts` + `lib/domain/activity.ts` (TDD). UI เป็น client components. เฟสนี้ทำงานบน fixtures (การเปลี่ยนแปลงอยู่ใน state ฝั่ง client; การเขียนกลับ Google Sheet ต่อในเฟสถัดไป)

**Tech Stack:** Next.js App Router, React client components (native HTML5 drag & drop), Tailwind, Vitest

---

## File Structure

- `lib/domain/kanban.ts` (+test) — groupByColumn, moveTask
- `lib/domain/activity.ts` (+test) — applyTaskEdit (editCount+1 + log entries), makeMoveLog
- `lib/data/project.ts` — getProjectData(id) จาก fixtures (คืน EnrichedProject + users)
- `components/kanban/TaskCard.tsx` — การ์ด (title, SLA badge, avatar, due, editCount)
- `components/kanban/KanbanBoard.tsx` — คอลัมน์ + DnD + state
- `components/kanban/TaskDetailDrawer.tsx` — รายละเอียด + ฟอร์มแก้ไข + activity log list
- `app/projects/[id]/page.tsx` — server: โหลด project → render board
- แก้ `components/gantt/GanttChart.tsx` — ชื่อโปรเจกต์เป็นลิงก์ไป `/projects/[id]`

---

## Task 1: Kanban grouping + move (pure, TDD)

**Files:** `lib/domain/kanban.ts`, `lib/domain/kanban.test.ts`

- [ ] Step 1 — test:
```typescript
import { describe, it, expect } from 'vitest'
import { groupByColumn, moveTask } from './kanban'
import type { Task } from './types'

const base: Omit<Task, 'id' | 'columnStatus' | 'order'> = {
  projectId: 'p1', title: 'T', assigneeId: 'u1', startDate: '2026-07-01', dueDate: '2026-07-10',
  slaStatus: 'on-track', editCount: 0, description: '', createdAt: '', updatedAt: '',
}
const tasks: Task[] = [
  { ...base, id: 'a', columnStatus: 'To Do', order: 0 },
  { ...base, id: 'b', columnStatus: 'To Do', order: 1 },
  { ...base, id: 'c', columnStatus: 'Done', order: 0 },
]

describe('groupByColumn', () => {
  it('จัดกลุ่มตามคอลัมน์ เรียงตาม order', () => {
    const g = groupByColumn(tasks, ['To Do', 'In Progress', 'Done'])
    expect(g['To Do'].map((t) => t.id)).toEqual(['a', 'b'])
    expect(g['In Progress']).toEqual([])
    expect(g['Done'].map((t) => t.id)).toEqual(['c'])
  })
})

describe('moveTask', () => {
  it('ย้าย task ไปคอลัมน์ปลายทางและอัปเดต columnStatus', () => {
    const next = moveTask(tasks, 'a', 'Done')
    const moved = next.find((t) => t.id === 'a')!
    expect(moved.columnStatus).toBe('Done')
  })
  it('ไม่แตะ task อื่น', () => {
    const next = moveTask(tasks, 'a', 'Done')
    expect(next.find((t) => t.id === 'b')!.columnStatus).toBe('To Do')
  })
})
```
- [ ] Step 2 — run FAIL
- [ ] Step 3 — impl:
```typescript
import type { Task } from './types'

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

export function moveTask(tasks: Task[], taskId: string, toColumn: string): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, columnStatus: toColumn } : t))
}
```
- [ ] Step 4 — run PASS
- [ ] Step 5 — commit `feat: add kanban grouping and move logic with tests`

---

## Task 2: Activity log + edit helpers (pure, TDD)

**Files:** `lib/domain/activity.ts`, `lib/domain/activity.test.ts`

- [ ] Step 1 — test:
```typescript
import { describe, it, expect } from 'vitest'
import { applyTaskEdit, makeMoveLog } from './activity'
import type { Task } from './types'

const task: Task = {
  id: 'a', projectId: 'p1', title: 'เดิม', assigneeId: 'u1', columnStatus: 'To Do',
  startDate: '2026-07-01', dueDate: '2026-07-10', slaStatus: 'on-track', editCount: 2,
  description: '', order: 0, createdAt: '', updatedAt: '',
}

describe('applyTaskEdit', () => {
  it('เพิ่ม editCount และสร้าง log ต่อฟิลด์ที่เปลี่ยน', () => {
    const { task: t, logs } = applyTaskEdit(task, { title: 'ใหม่' }, 'u9', '2026-07-01T00:00:00Z')
    expect(t.editCount).toBe(3)
    expect(t.title).toBe('ใหม่')
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({ field: 'title', oldValue: 'เดิม', newValue: 'ใหม่', action: 'update', actorId: 'u9' })
  })
  it('ไม่เปลี่ยนอะไร = ไม่เพิ่ม editCount, ไม่มี log', () => {
    const { task: t, logs } = applyTaskEdit(task, { title: 'เดิม' }, 'u9', '2026-07-01T00:00:00Z')
    expect(t.editCount).toBe(2)
    expect(logs).toHaveLength(0)
  })
})

describe('makeMoveLog', () => {
  it('สร้าง log action=move', () => {
    const log = makeMoveLog(task, 'Done', 'u9', '2026-07-01T00:00:00Z')
    expect(log).toMatchObject({ action: 'move', field: 'columnStatus', oldValue: 'To Do', newValue: 'Done' })
  })
})
```
- [ ] Step 2 — run FAIL
- [ ] Step 3 — impl (applyTaskEdit เทียบเฉพาะฟิลด์ที่แก้ได้: title, description, assigneeId, startDate, dueDate; ถ้ามีการเปลี่ยน → editCount+1 + สร้าง log ต่อฟิลด์; id ของ log = `${entityId}-${timestamp}-${field}`)
- [ ] Step 4 — run PASS
- [ ] Step 5 — commit `feat: add task edit/log helpers with tests`

---

## Task 3: Single-project data provider

**Files:** `lib/data/project.ts`

- [ ] getProjectData(id): หา project จาก enrich (ใช้ getDashboardData ซ้ำ) คืน { project, users: FIXTURE_USERS }; ถ้าไม่พบคืน null
- [ ] commit `feat: add single project data provider`

---

## Task 4: TaskCard + KanbanBoard (DnD)

**Files:** `components/kanban/TaskCard.tsx`, `components/kanban/KanbanBoard.tsx`

- [ ] TaskCard: การ์ดขาว แสดง title, StatusBadge(slaStatus), Avatar(assignee), due date, "✏️ n ครั้ง"; draggable; onClick → เปิด detail
- [ ] KanbanBoard (client): state tasks + selectedTaskId; groupByColumn; คอลัมน์รับ drop → moveTask + append moveLog ลง state; render TaskDetailDrawer
- [ ] commit `feat: add kanban board with drag and drop`

---

## Task 5: TaskDetailDrawer

**Files:** `components/kanban/TaskDetailDrawer.tsx`

- [ ] Drawer ด้านขวา: ฟอร์มแก้ title/description/assignee/start/due; ปุ่มบันทึก → applyTaskEdit → อัปเดต state + prepend logs; แสดง editCount + รายการ Activity Log (เรียงใหม่→เก่า)
- [ ] commit `feat: add task detail drawer with edit and activity log`

---

## Task 6: Project page + link from Gantt

**Files:** `app/projects/[id]/page.tsx`, แก้ `components/gantt/GanttChart.tsx`

- [ ] project page (server): `const d = await getProjectData(id)`; ถ้า null → notFound(); render header (ชื่อ, ทีม, ช่วงเวลา) + `<KanbanBoard ... />`
- [ ] GanttChart: เปลี่ยนชื่อโปรเจกต์เป็น `<Link href={`/projects/${p.id}`}>`
- [ ] commit `feat: wire project kanban page and gantt links`

---

## Task 7: Verify

- [ ] `npm test` — PASS ทั้งหมด
- [ ] `npm run build` — ผ่าน
- [ ] `npm run dev` → คลิกโปรเจกต์จาก Gantt → เห็น Kanban → ลากการ์ด → เปิด detail → แก้ไข เห็น editCount+log
- [ ] commit `chore: complete Phase 3 kanban`
