# Phase 2: Dashboard Gantt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** หน้า Dashboard แสดง Gantt ตารางเดียว — แถว Project (กาง/ยุบดู Task ย่อย), avatar, สถานะ SLA (สี+สัญลักษณ์), แกนเวลาหลายชั้นปรับตามซูม, เส้นวันนี้

**Architecture:** Logic เรขาคณิตของแท่ง/หัวตารางเป็นฟังก์ชันบริสุทธิ์ใน `lib/domain/gantt*` (TDD). UI เป็น client components ใน `components/gantt/`. ข้อมูลมาจาก `lib/data/dashboard.ts` ซึ่งใช้ fixtures ตอนยังไม่มี credential แล้วสลับเป็น Sheets ภายหลัง

**Tech Stack:** Next.js App Router, React client components, Tailwind, date-fns, Vitest

---

## File Structure

- `lib/domain/ganttGeometry.ts` (+test) — คำนวณ range เวลา + ตำแหน่ง/ความกว้างแท่ง (%)
- `lib/domain/ganttHeader.ts` (+test) — สร้าง segment ของแต่ละชั้นเวลา (year/quarter/month/week/day)
- `lib/data/fixtures.ts` — ข้อมูลตัวอย่าง (users/projects/tasks)
- `lib/data/dashboard.ts` — getDashboardData(): ใช้ Sheets ถ้าตั้งค่า, ไม่งั้น fixtures
- `components/ui/Avatar.tsx`, `components/ui/StatusBadge.tsx`
- `components/gantt/ZoomControl.tsx`, `GanttHeader.tsx`, `GanttBar.tsx`, `GanttRow.tsx`, `GanttChart.tsx`
- `app/page.tsx` — Dashboard (server) → render `<GanttChart data=… />`

---

## Task 1: Gantt geometry (pure, TDD)

**Files:** `lib/domain/ganttGeometry.ts`, `lib/domain/ganttGeometry.test.ts`

- [ ] Step 1 — test:
```typescript
import { describe, it, expect } from 'vitest'
import { barMetrics, timelineRange } from './ganttGeometry'

describe('timelineRange', () => {
  it('คืนช่วงครอบคลุมทุกวันที่ (min start, max due)', () => {
    const r = timelineRange([
      { startDate: '2026-07-01', dueDate: '2026-07-10' },
      { startDate: '2026-07-05', dueDate: '2026-08-01' },
    ])
    expect(r.start).toBe('2026-07-01')
    expect(r.end).toBe('2026-08-01')
  })
  it('ช่วงว่าง = คืน null', () => {
    expect(timelineRange([])).toBeNull()
  })
})

describe('barMetrics', () => {
  const range = { start: '2026-07-01', end: '2026-07-11' } // 10 วัน
  it('แท่งที่เริ่มต้นช่วงพอดี left=0', () => {
    const m = barMetrics('2026-07-01', '2026-07-02', range)
    expect(m.leftPct).toBeCloseTo(0, 5)
  })
  it('ความกว้าง = สัดส่วนจำนวนวันต่อช่วงรวม', () => {
    const m = barMetrics('2026-07-01', '2026-07-06', range)
    expect(m.widthPct).toBeCloseTo(50, 5)
  })
  it('clamp ไม่ให้เกิน 100%', () => {
    const m = barMetrics('2026-07-06', '2026-07-31', range)
    expect(m.leftPct + m.widthPct).toBeLessThanOrEqual(100.0001)
  })
})
```
- [ ] Step 2 — run, expect FAIL: `npx vitest run lib/domain/ganttGeometry.test.ts`
- [ ] Step 3 — impl:
```typescript
import { differenceInCalendarDays } from 'date-fns'

export interface DateRange { start: string; end: string }

export function timelineRange(items: { startDate: string; dueDate: string }[]): DateRange | null {
  const dates = items.flatMap((i) => [i.startDate, i.dueDate]).filter(Boolean)
  if (dates.length === 0) return null
  const sorted = [...dates].sort()
  return { start: sorted[0], end: sorted[sorted.length - 1] }
}

export function barMetrics(start: string, due: string, range: DateRange): { leftPct: number; widthPct: number } {
  const total = Math.max(1, differenceInCalendarDays(new Date(range.end), new Date(range.start)))
  const offset = differenceInCalendarDays(new Date(start), new Date(range.start))
  const span = Math.max(1, differenceInCalendarDays(new Date(due), new Date(start)))
  let leftPct = (offset / total) * 100
  let widthPct = (span / total) * 100
  if (leftPct < 0) { widthPct += leftPct; leftPct = 0 }
  if (leftPct + widthPct > 100) widthPct = 100 - leftPct
  return { leftPct, widthPct: Math.max(0, widthPct) }
}
```
- [ ] Step 4 — run, expect PASS
- [ ] Step 5 — commit `feat: add gantt geometry with tests`

---

## Task 2: Header segments (pure, TDD)

**Files:** `lib/domain/ganttHeader.ts`, `lib/domain/ganttHeader.test.ts`

- [ ] Step 1 — test:
```typescript
import { describe, it, expect } from 'vitest'
import { monthSegments } from './ganttHeader'

describe('monthSegments', () => {
  it('แบ่งช่วงเป็นเดือน พร้อม label และความกว้าง %', () => {
    const segs = monthSegments({ start: '2026-07-01', end: '2026-09-01' })
    expect(segs.map((s) => s.label)).toEqual(['ก.ค. 2026', 'ส.ค. 2026', 'ก.ย. 2026'])
    const totalWidth = segs.reduce((a, s) => a + s.widthPct, 0)
    expect(totalWidth).toBeCloseTo(100, 1)
  })
})
```
- [ ] Step 2 — run FAIL
- [ ] Step 3 — impl `monthSegments` (ใช้ eachMonthOfInterval จาก date-fns + barMetrics เทียบความกว้างเดือน); label เดือนไทยย่อผ่าน map
- [ ] Step 4 — run PASS
- [ ] Step 5 — commit `feat: add gantt header month segments with tests`

---

## Task 3: Fixtures + data provider

**Files:** `lib/data/fixtures.ts`, `lib/data/dashboard.ts`

- [ ] Step 1 — สร้าง fixtures: 3-4 projects, แต่ละอันมี 2-4 tasks, assignee หลากหลาย, สถานะครบ (on-track/at-risk/overdue/done)
- [ ] Step 2 — `getDashboardData()`: ถ้า `process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL` ไม่มี → คืน fixtures; ไม่งั้นอ่านจาก Sheets (getTab) แล้ว join projects+tasks (เฟสนี้ทำ path fixtures ให้ครบ, path Sheets ต่อเฟส 3)
- [ ] Step 3 — คำนวณ slaStatus ของแต่ละ task ด้วย computeSlaStatus + สถานะโปรเจกต์ = แย่สุดของ tasks
- [ ] Step 4 — commit `feat: add dashboard fixtures and data provider`

---

## Task 4: UI primitives

**Files:** `components/ui/Avatar.tsx`, `components/ui/StatusBadge.tsx`

- [ ] Avatar: วงกลมสีจากผู้ใช้ + อักษรย่อ; รองรับ overlap group
- [ ] StatusBadge: map สถานะ → {สี, สัญลักษณ์ ✓/⚠/✕/✔, label}
- [ ] commit `feat: add Avatar and StatusBadge UI primitives`

---

## Task 5: Gantt components

**Files:** `components/gantt/ZoomControl.tsx`, `GanttHeader.tsx`, `GanttBar.tsx`, `GanttRow.tsx`, `GanttChart.tsx`

- [ ] ZoomControl: ปุ่ม 5 ระดับ (ปี/ไตรมาส/เดือน/สัปดาห์/วัน) ควบคุม state
- [ ] GanttHeader: render ชั้นตาม layersForZoom(zoom) โดยใช้ segment functions
- [ ] GanttBar: แท่งตำแหน่ง/กว้างจาก barMetrics + สี+สัญลักษณ์ StatusBadge
- [ ] GanttRow: แถว Project (avatar รวม + ปุ่ม +/−) และเมื่อกาง render Task rows (avatar เดี่ยว)
- [ ] GanttChart (client): ถือ state zoom + expanded set; วางหัวตาราง + rows + เส้นวันนี้; sticky ซ้าย (ชื่อ) + scroll แนวนอน
- [ ] commit `feat: add gantt chart components`

---

## Task 6: Dashboard page

**Files:** `app/page.tsx`

- [ ] server component: `const data = await getDashboardData()` → `<GanttChart data={data} />` + แถบสรุปด้านบน (จำนวน/overdue/at-risk)
- [ ] commit `feat: wire dashboard page to gantt`

---

## Task 7: Verify

- [ ] `npm test` — PASS ทั้งหมด
- [ ] `npm run build` — ผ่าน
- [ ] `npm run dev` → เปิด http://localhost:3000 ดู Gantt ทำงาน (กาง/ยุบ, ซูม, สี/สัญลักษณ์)
- [ ] commit `chore: complete Phase 2 dashboard gantt`
