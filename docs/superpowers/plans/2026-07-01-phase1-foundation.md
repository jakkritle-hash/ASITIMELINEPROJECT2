# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** วางรากฐานแอป — Next.js + logic บริสุทธิ์ที่ทดสอบได้ (SLA, สิทธิ์, adaptive time-layers) + ชั้นเข้าถึง Google Sheet + Auth (Google เฉพาะโดเมน) + health check

**Architecture:** Next.js (App Router, TypeScript) เป็นทั้ง frontend/backend. Logic ธุรกิจอยู่ใน `lib/domain/` (บริสุทธิ์ ทดสอบง่าย ไม่แตะ I/O). การอ่าน/เขียน Google Sheet ห่อไว้ใน `lib/sheets/`. Auth ใช้ Auth.js (NextAuth) Google provider ล็อกโดเมน `@planbmedia.co.th`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Vitest (unit test), Auth.js v5, `googleapis` (Sheets API v4), date-fns / date-fns-tz.

---

## File Structure (เฟสนี้)

- `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts` — scaffold + test config
- `lib/domain/sla.ts` — คำนวณสถานะ SLA (pure)
- `lib/domain/sla.test.ts`
- `lib/domain/permissions.ts` — ตรวจสิทธิ์ตาม role (pure)
- `lib/domain/permissions.test.ts`
- `lib/domain/timeLayers.ts` — กติกา adaptive time-layer ตามระดับซูม (pure)
- `lib/domain/timeLayers.test.ts`
- `lib/domain/types.ts` — TypeScript types กลาง (User, Team, Project, Task, Role, ...)
- `lib/sheets/client.ts` — สร้าง Google Sheets API client จาก service account
- `lib/sheets/repository.ts` — อ่าน/เขียนต่อ tab (getRows/appendRow/updateRow) + แปลง row↔object
- `lib/auth/config.ts` — Auth.js config (Google provider, domain guard, bootstrap admin)
- `app/api/health/route.ts` — health check (เช็คว่าต่อ Sheet ได้ + tab ครบ)
- `.env.example` — รายการ env ที่ต้องตั้ง
- `.gitignore`

---

## Task 1: Scaffold โปรเจกต์ Next.js + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: สร้างแอปด้วย create-next-app (non-interactive)**

Run:
```bash
cd "C:/Users/jakkrit.le/Desktop/Coworkweb"
npx --yes create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --no-turbopack --yes
```
Expected: สร้างไฟล์ scaffold สำเร็จ (ถ้าโฟลเดอร์ไม่ว่างเพราะมี `docs/` อยู่ ให้ยืนยัน overwrite เฉพาะไฟล์ config — `docs/` จะไม่ถูกแตะ)

- [ ] **Step 2: ติดตั้ง dependencies เพิ่ม**

Run:
```bash
npm install googleapis next-auth@beta date-fns date-fns-tz
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
```
Expected: ติดตั้งสำเร็จ ไม่มี error

- [ ] **Step 3: สร้าง vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['lib/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: เพิ่ม script test ใน package.json**

เพิ่มใน `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: สร้าง .env.example**

```bash
# Google OAuth (Auth.js)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=
# Google Sheets
SHEET_ID=1PqBojl-LRRnfCymOtz-jGRyCBq_-iY9YKurvSv-sCf8
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
# App config
ALLOWED_DOMAIN=planbmedia.co.th
BOOTSTRAP_ADMIN_EMAILS=jakkrit.le@planbmedia.co.th
```

- [ ] **Step 6: ยืนยัน .gitignore มี .env และ .superpowers**

ตรวจว่า `.gitignore` มีบรรทัด `.env*` (create-next-app ใส่ให้แล้ว) และเพิ่ม `.superpowers/` ถ้ายังไม่มี

- [ ] **Step 7: รัน test runner ครั้งแรก (ยังไม่มี test)**

Run: `npm test`
Expected: "No test files found" — ยืนยันว่า vitest ทำงาน

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Vitest and deps"
```

---

## Task 2: Types กลาง

**Files:**
- Create: `lib/domain/types.ts`

- [ ] **Step 1: สร้าง types.ts**

```typescript
export type Role = 'Admin' | 'Manager' | 'Member'
export type SlaStatus = 'on-track' | 'at-risk' | 'overdue' | 'done'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatarColor: string
  active: boolean
  createdAt: string
}

export interface Team {
  id: string
  name: string
  memberIds: string[]
  leadUserId: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  teamId: string
  memberIds: string[]
  ownerUserId: string
  startDate: string   // ISO date (YYYY-MM-DD)
  dueDate: string
  status: SlaStatus
  description: string
  kanbanColumns: string[]
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  assigneeId: string
  columnStatus: string
  startDate: string
  dueDate: string
  slaStatus: SlaStatus
  editCount: number
  description: string
  order: number
  createdAt: string
  updatedAt: string
}

export type LogAction = 'create' | 'update' | 'move' | 'delete'

export interface ActivityLogEntry {
  id: string
  timestamp: string
  actorId: string
  entityType: 'project' | 'task'
  entityId: string
  action: LogAction
  field: string
  oldValue: string
  newValue: string
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/domain/types.ts
git commit -m "feat: add core domain types"
```

---

## Task 3: SLA calculation (pure, TDD)

> 🎓 **จุดที่อยากให้คุณ (ผู้ใช้) ร่วมตัดสินใจ:** logic ของ `at-risk` มีหลายแบบ — นับ "วันตามปฏิทิน" หรือ "วันทำงาน (ไม่รวมเสาร์-อาทิตย์)"? เฟสนี้ผมวางเป็น "วันตามปฏิทิน" ก่อน (ตามสเปก) แต่ตรงนี้เปลี่ยน logic ได้ง่ายถ้าคุณอยากใช้วันทำงาน — จุดแก้อยู่ในฟังก์ชันเดียว

**Files:**
- Create: `lib/domain/sla.ts`, `lib/domain/sla.test.ts`

- [ ] **Step 1: เขียน test ที่ fail ก่อน**

`lib/domain/sla.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { computeSlaStatus } from './sla'

const TZ = 'Asia/Bangkok'
// อ้างอิง "วันนี้" = 2026-07-01 เพื่อผลลัพธ์คงที่
const today = new Date('2026-07-01T03:00:00Z') // 10:00 ตามเวลาไทย

describe('computeSlaStatus', () => {
  it('คืน done เมื่อ isDone = true ไม่ว่ากำหนดจะเป็นอย่างไร', () => {
    expect(computeSlaStatus({ dueDate: '2026-06-01', isDone: true, now: today, tz: TZ, atRiskDays: 2 })).toBe('done')
  })

  it('คืน overdue เมื่อเลย dueDate และยังไม่เสร็จ', () => {
    expect(computeSlaStatus({ dueDate: '2026-06-30', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('overdue')
  })

  it('คืน at-risk เมื่อเหลือ <= atRiskDays วัน', () => {
    expect(computeSlaStatus({ dueDate: '2026-07-03', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('at-risk')
  })

  it('คืน on-track เมื่อยังเหลือเวลามากกว่า atRiskDays', () => {
    expect(computeSlaStatus({ dueDate: '2026-07-20', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('on-track')
  })

  it('วันครบกำหนดวันนี้พอดี = at-risk (ยังไม่เกิน)', () => {
    expect(computeSlaStatus({ dueDate: '2026-07-01', isDone: false, now: today, tz: TZ, atRiskDays: 2 })).toBe('at-risk')
  })
})
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `npx vitest run lib/domain/sla.test.ts`
Expected: FAIL — "computeSlaStatus is not defined" / import error

- [ ] **Step 3: เขียน implementation ขั้นต่ำให้ผ่าน**

`lib/domain/sla.ts`:
```typescript
import { differenceInCalendarDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { SlaStatus } from './types'

export interface SlaInput {
  dueDate: string   // YYYY-MM-DD
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
```

- [ ] **Step 4: รัน test ให้ผ่าน**

Run: `npx vitest run lib/domain/sla.test.ts`
Expected: PASS ทั้ง 5 เคส

- [ ] **Step 5: Commit**

```bash
git add lib/domain/sla.ts lib/domain/sla.test.ts
git commit -m "feat: add SLA status calculation with tests"
```

---

## Task 4: Permission checks (pure, TDD)

**Files:**
- Create: `lib/domain/permissions.ts`, `lib/domain/permissions.test.ts`

- [ ] **Step 1: เขียน test ที่ fail ก่อน**

`lib/domain/permissions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { canEditProject, canManageMembers, canEditTask } from './permissions'
import type { User, Project, Task } from './types'

const admin: User = { id: 'u1', email: 'a@x.co', name: 'A', role: 'Admin', avatarColor: '#000', active: true, createdAt: '' }
const manager: User = { ...admin, id: 'u2', role: 'Manager' }
const member: User = { ...admin, id: 'u3', role: 'Member' }

const project: Project = {
  id: 'p1', name: 'P', teamId: 't1', memberIds: ['u3'], ownerUserId: 'u3',
  startDate: '2026-07-01', dueDate: '2026-07-31', status: 'on-track',
  description: '', kanbanColumns: ['To Do', 'Done'], createdAt: '', updatedAt: '',
}
const task: Task = {
  id: 'k1', projectId: 'p1', title: 'T', assigneeId: 'u3', columnStatus: 'To Do',
  startDate: '2026-07-01', dueDate: '2026-07-10', slaStatus: 'on-track',
  editCount: 0, description: '', order: 0, createdAt: '', updatedAt: '',
}

describe('permissions', () => {
  it('Admin แก้ได้ทุกโปรเจกต์', () => {
    expect(canEditProject(admin, project)).toBe(true)
  })
  it('Manager แก้โปรเจกต์ในทีมตัวเองได้ (leadTeamIds มี teamId)', () => {
    expect(canEditProject(manager, project, ['t1'])).toBe(true)
  })
  it('Manager แก้โปรเจกต์นอกทีมไม่ได้', () => {
    expect(canEditProject(manager, project, ['t9'])).toBe(false)
  })
  it('Member แก้โปรเจกต์ที่ตนเป็นเจ้าของได้', () => {
    expect(canEditProject(member, project)).toBe(true)
  })
  it('Member ที่ไม่เกี่ยวข้องแก้โปรเจกต์ไม่ได้', () => {
    const outsider: User = { ...member, id: 'u9' }
    expect(canEditProject(outsider, project)).toBe(false)
  })
  it('เฉพาะ Admin จัดการ members ได้', () => {
    expect(canManageMembers(admin)).toBe(true)
    expect(canManageMembers(manager)).toBe(false)
    expect(canManageMembers(member)).toBe(false)
  })
  it('Member แก้ task ที่ตนเป็นผู้รับผิดชอบได้', () => {
    expect(canEditTask(member, task, project)).toBe(true)
  })
  it('Member แก้ task ที่ไม่ใช่ของตนและไม่ใช่โปรเจกต์ตนไม่ได้', () => {
    const outsider: User = { ...member, id: 'u9' }
    expect(canEditTask(outsider, task, project)).toBe(false)
  })
})
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `npx vitest run lib/domain/permissions.test.ts`
Expected: FAIL — functions not defined

- [ ] **Step 3: เขียน implementation ขั้นต่ำให้ผ่าน**

`lib/domain/permissions.ts`:
```typescript
import type { User, Project, Task } from './types'

/** Admin แก้ได้ทุกอย่าง; Manager แก้ได้ถ้าโปรเจกต์อยู่ในทีมที่ตนเป็นหัวหน้า; Member แก้ได้ถ้าเป็นเจ้าของหรือสมาชิกโปรเจกต์ */
export function canEditProject(user: User, project: Project, leadTeamIds: string[] = []): boolean {
  if (user.role === 'Admin') return true
  if (user.role === 'Manager' && leadTeamIds.includes(project.teamId)) return true
  return project.ownerUserId === user.id || project.memberIds.includes(user.id)
}

/** เฉพาะ Admin จัดการผู้ใช้/บทบาท */
export function canManageMembers(user: User): boolean {
  return user.role === 'Admin'
}

/** แก้ task ได้ถ้าแก้โปรเจกต์ได้ หรือเป็นผู้รับผิดชอบ task นั้น */
export function canEditTask(user: User, task: Task, project: Project, leadTeamIds: string[] = []): boolean {
  if (canEditProject(user, project, leadTeamIds)) return true
  return task.assigneeId === user.id
}
```

- [ ] **Step 4: รัน test ให้ผ่าน**

Run: `npx vitest run lib/domain/permissions.test.ts`
Expected: PASS ทั้งหมด

- [ ] **Step 5: Commit**

```bash
git add lib/domain/permissions.ts lib/domain/permissions.test.ts
git commit -m "feat: add role-based permission checks with tests"
```

---

## Task 5: Adaptive time-layers (pure, TDD)

**Files:**
- Create: `lib/domain/timeLayers.ts`, `lib/domain/timeLayers.test.ts`

- [ ] **Step 1: เขียน test ที่ fail ก่อน**

`lib/domain/timeLayers.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { layersForZoom, ZOOM_LEVELS } from './timeLayers'

describe('layersForZoom', () => {
  it('มีระดับซูมครบ 5 ระดับ', () => {
    expect(ZOOM_LEVELS).toEqual(['year', 'quarter', 'month', 'week', 'day'])
  })
  it('ปี → [ปี, ไตรมาส]', () => {
    expect(layersForZoom('year')).toEqual(['year', 'quarter'])
  })
  it('ไตรมาส → [ไตรมาส, เดือน]', () => {
    expect(layersForZoom('quarter')).toEqual(['quarter', 'month'])
  })
  it('เดือน → [เดือน, สัปดาห์]', () => {
    expect(layersForZoom('month')).toEqual(['month', 'week'])
  })
  it('สัปดาห์ → [สัปดาห์, วัน]', () => {
    expect(layersForZoom('week')).toEqual(['week', 'day'])
  })
  it('วัน → [เดือน, สัปดาห์, วัน]', () => {
    expect(layersForZoom('day')).toEqual(['month', 'week', 'day'])
  })
})
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `npx vitest run lib/domain/timeLayers.test.ts`
Expected: FAIL — not defined

- [ ] **Step 3: เขียน implementation ขั้นต่ำให้ผ่าน**

`lib/domain/timeLayers.ts`:
```typescript
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
```

- [ ] **Step 4: รัน test ให้ผ่าน**

Run: `npx vitest run lib/domain/timeLayers.test.ts`
Expected: PASS ทั้งหมด

- [ ] **Step 5: Commit**

```bash
git add lib/domain/timeLayers.ts lib/domain/timeLayers.test.ts
git commit -m "feat: add adaptive Gantt time-layer rules with tests"
```

---

## Task 6: Google Sheets client (service account)

**Files:**
- Create: `lib/sheets/client.ts`

- [ ] **Step 1: เขียน client.ts**

```typescript
import { google } from 'googleapis'

/** สร้าง Sheets API client จาก service account ใน env
 *  (PRIVATE_KEY เก็บใน env โดยแทน newline ด้วย \n — แปลงกลับตอนใช้) */
export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export function getSheetId(): string {
  const id = process.env.SHEET_ID
  if (!id) throw new Error('Missing SHEET_ID')
  return id
}
```

- [ ] **Step 2: ตรวจ typecheck ผ่าน**

Run: `npx tsc --noEmit`
Expected: ไม่มี error (ถ้า error เรื่อง type ของ googleapis ให้ตรวจว่าติดตั้งแล้ว)

- [ ] **Step 3: Commit**

```bash
git add lib/sheets/client.ts
git commit -m "feat: add Google Sheets API client from service account"
```

---

## Task 7: Sheets repository (row ↔ object) + tab helpers

**Files:**
- Create: `lib/sheets/repository.ts`, `lib/sheets/repository.test.ts`

- [ ] **Step 1: เขียน test สำหรับ pure helper (map row ↔ object)**

`lib/sheets/repository.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { rowsToObjects, objectToRow } from './repository'

describe('rowsToObjects', () => {
  it('แปลง 2D array (แถวแรก=header) เป็น array ของ object', () => {
    const values = [
      ['id', 'name', 'active'],
      ['1', 'A', 'true'],
      ['2', 'B', 'false'],
    ]
    expect(rowsToObjects(values)).toEqual([
      { id: '1', name: 'A', active: 'true' },
      { id: '2', name: 'B', active: 'false' },
    ])
  })
  it('คืน [] เมื่อไม่มีข้อมูล (มีแต่ header หรือว่าง)', () => {
    expect(rowsToObjects([['id', 'name']])).toEqual([])
    expect(rowsToObjects([])).toEqual([])
  })
})

describe('objectToRow', () => {
  it('เรียงค่าตามลำดับ header ที่กำหนด', () => {
    const obj = { id: '1', name: 'A', active: 'true' }
    expect(objectToRow(obj, ['id', 'name', 'active'])).toEqual(['1', 'A', 'true'])
  })
  it('ช่องที่ไม่มีค่า = string ว่าง', () => {
    expect(objectToRow({ id: '1' }, ['id', 'name'])).toEqual(['1', ''])
  })
})
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `npx vitest run lib/sheets/repository.test.ts`
Expected: FAIL — not defined

- [ ] **Step 3: เขียน implementation**

`lib/sheets/repository.ts`:
```typescript
import { getSheetsClient, getSheetId } from './client'

export function rowsToObjects(values: string[][]): Record<string, string>[] {
  if (!values || values.length < 2) return []
  const [header, ...rows] = values
  return rows.map((row) => {
    const obj: Record<string, string> = {}
    header.forEach((key, i) => { obj[key] = row[i] ?? '' })
    return obj
  })
}

export function objectToRow(obj: Record<string, unknown>, header: string[]): string[] {
  return header.map((key) => {
    const v = obj[key]
    return v === undefined || v === null ? '' : String(v)
  })
}

/** อ่านทั้ง tab (รวม header) แล้วแปลงเป็น array ของ object */
export async function getTab(tab: string): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: tab,
  })
  return rowsToObjects((res.data.values as string[][]) ?? [])
}

/** append หนึ่งแถวต่อท้าย tab ตามลำดับ header */
export async function appendRow(tab: string, obj: Record<string, unknown>, header: string[]): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: tab,
    valueInputOption: 'RAW',
    requestBody: { values: [objectToRow(obj, header)] },
  })
}
```

- [ ] **Step 4: รัน test ให้ผ่าน**

Run: `npx vitest run lib/sheets/repository.test.ts`
Expected: PASS (เฉพาะ pure helper — `getTab`/`appendRow` ไม่ถูกเรียกใน test)

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/repository.ts lib/sheets/repository.test.ts
git commit -m "feat: add sheets repository with row/object mapping and tests"
```

---

## Task 8: Auth.js (Google, domain-restricted, bootstrap admin)

**Files:**
- Create: `lib/auth/config.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

- [ ] **Step 1: เขียน pure helper สำหรับตรวจโดเมน + bootstrap role (TDD)**

`lib/auth/policy.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { isAllowedEmail, initialRoleFor } from './policy'

describe('isAllowedEmail', () => {
  it('อนุญาตเฉพาะโดเมนที่กำหนด', () => {
    expect(isAllowedEmail('a@planbmedia.co.th', 'planbmedia.co.th')).toBe(true)
    expect(isAllowedEmail('a@gmail.com', 'planbmedia.co.th')).toBe(false)
    expect(isAllowedEmail('', 'planbmedia.co.th')).toBe(false)
  })
})

describe('initialRoleFor', () => {
  it('อีเมลใน bootstrap list = Admin', () => {
    expect(initialRoleFor('boss@planbmedia.co.th', ['boss@planbmedia.co.th'])).toBe('Admin')
  })
  it('อีเมลอื่น = Member', () => {
    expect(initialRoleFor('x@planbmedia.co.th', ['boss@planbmedia.co.th'])).toBe('Member')
  })
})
```

- [ ] **Step 2: รัน test ให้เห็นว่า fail**

Run: `npx vitest run lib/auth/policy.test.ts`
Expected: FAIL — not defined

- [ ] **Step 3: เขียน `lib/auth/policy.ts`**

```typescript
import type { Role } from '@/lib/domain/types'

export function isAllowedEmail(email: string, allowedDomain: string): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith('@' + allowedDomain.toLowerCase())
}

export function initialRoleFor(email: string, bootstrapAdmins: string[]): Role {
  return bootstrapAdmins.map((e) => e.toLowerCase()).includes(email.toLowerCase()) ? 'Admin' : 'Member'
}
```

- [ ] **Step 4: รัน test ให้ผ่าน**

Run: `npx vitest run lib/auth/policy.test.ts`
Expected: PASS

- [ ] **Step 5: เขียน Auth.js config**

`lib/auth/config.ts`:
```typescript
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAllowedEmail } from './policy'

const allowedDomain = process.env.ALLOWED_DOMAIN || 'planbmedia.co.th'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: { params: { hd: allowedDomain, prompt: 'select_account' } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = (profile?.email as string) || ''
      return isAllowedEmail(email, allowedDomain)
    },
    async session({ session }) {
      return session
    },
  },
})
```

- [ ] **Step 6: เขียน route handler + middleware**

`app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth/config'
export const { GET, POST } = handlers
```

`middleware.ts`:
```typescript
export { auth as middleware } from '@/lib/auth/config'
export const config = { matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'] }
```

- [ ] **Step 7: typecheck**

Run: `npx tsc --noEmit`
Expected: ไม่มี error

- [ ] **Step 8: Commit**

```bash
git add lib/auth app/api/auth middleware.ts
git commit -m "feat: add Google auth restricted to company domain with bootstrap admin"
```

---

## Task 9: Health check endpoint

**Files:**
- Create: `app/api/health/route.ts`

- [ ] **Step 1: เขียน health route**

```typescript
import { NextResponse } from 'next/server'
import { getTab } from '@/lib/sheets/repository'

const REQUIRED_TABS = ['Users', 'Teams', 'Projects', 'Tasks', 'ActivityLog', 'Config']

export async function GET() {
  const result: Record<string, unknown> = { ok: true, tabs: {} }
  try {
    for (const tab of REQUIRED_TABS) {
      try {
        const rows = await getTab(tab)
        ;(result.tabs as Record<string, unknown>)[tab] = { ok: true, rows: rows.length }
      } catch (e) {
        result.ok = false
        ;(result.tabs as Record<string, unknown>)[tab] = { ok: false, error: (e as Error).message }
      }
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
```

- [ ] **Step 2: typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build ผ่าน (health route จะยังต่อ Sheet ไม่ได้จนกว่าจะตั้ง env จริง — ปกติ)

- [ ] **Step 3: Commit**

```bash
git add app/api/health/route.ts
git commit -m "feat: add health check verifying Sheet tabs"
```

---

## Task 10: รัน test suite ทั้งหมด + ยืนยันเฟส 1 เสร็จ

- [ ] **Step 1: รัน test ทั้งหมด**

Run: `npm test`
Expected: PASS ทุกไฟล์ (sla, permissions, timeLayers, repository, auth/policy)

- [ ] **Step 2: Commit สรุป (ถ้ามีไฟล์ค้าง)**

```bash
git add -A
git commit -m "chore: complete Phase 1 foundation" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage (เฟสนี้):** Auth โดเมน ✅ (Task 8), roles ✅ (Task 4), โครง types สำหรับ 6 tabs ✅ (Task 2), SLA logic + timezone ✅ (Task 3), adaptive layers ✅ (Task 5), Sheets access + health ✅ (Task 6/7/9), bootstrap admin ✅ (Task 8)
- **เลื่อนไปเฟสถัดไป:** UI Gantt (เฟส 2), Kanban/editCount/log write (เฟส 3), admin CRUD (เฟส 4), optimistic-lock บนการเขียนจริง (เฟส 2/3 ตอนเริ่มเขียน Task/Project)
- **ต้องมีของจริงก่อนรัน end-to-end:** service account + แชร์ Sheet + สร้าง 6 tabs พร้อม header + OAuth client (จะทำเป็น setup guide ตอนเริ่มเฟส 2 หรือเมื่อคุณพร้อมให้ credential)
