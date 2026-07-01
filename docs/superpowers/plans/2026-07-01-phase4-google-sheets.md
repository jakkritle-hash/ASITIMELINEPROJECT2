# Phase 4: Google Sheets Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** สลับจาก fixtures เป็น Google Sheet จริง — อ่าน/เขียนข้อมูล, ล็อกอิน Google จริง + provision ผู้ใช้, บันทึกการแก้ไข/ลากการ์ด/จัดการทีมถาวร, optimistic lock กันเขียนทับ, seed 6 tabs อัตโนมัติ

**Architecture:** เพิ่ม schema (header ต่อ tab + parse/serialize) และ write ops ใน `lib/sheets/`. Data providers เติม path Sheets (parse rows → typed) โดยคง fixtures fallback. Mutations ผ่าน Next.js **server actions** ที่ตรวจ session + สิทธิ์ + เขียน Sheet + append ActivityLog + ตรวจ updatedAt (optimistic). Auth provision ผู้ใช้ใหม่ลง tab Users.

**Tech Stack:** Next.js server actions, googleapis, Auth.js v5, Vitest

---

## File Structure

- `lib/sheets/schema.ts` (+test) — TAB_HEADERS, parseRow→typed, serialize (csv/bool/number)
- `lib/sheets/repository.ts` (แก้) — getTabWithRowNumbers, updateRowById, ensureTabsAndHeaders (seed)
- `lib/data/dashboard.ts` / `project.ts` / `admin.ts` (แก้) — path Sheets จริง
- `lib/auth/config.ts` (แก้) — provisionUser + session role + authorized gate
- `lib/auth/session.ts` — getCurrentUser() อ่าน session→ผู้ใช้จาก Users tab
- `app/actions/tasks.ts` — editTaskAction, moveTaskAction
- `app/actions/admin.ts` — setRoleAction, teamOps actions
- `app/api/seed/route.ts` — สร้าง tabs+header + seed fixtures (guard ด้วย SEED_SECRET)
- แก้ UI (KanbanBoard/MembersTable/TeamsManager) ให้เรียก server action
- `docs/superpowers/SETUP-google-sheets.md` — คู่มือตั้งค่า credential

---

## Task 1: Schema — headers + parse/serialize (pure, TDD)

**Files:** `lib/sheets/schema.ts`, `lib/sheets/schema.test.ts`

- [ ] test: `parseUser(row)` แปลง active "true"→bool, `serializeUser` แปลง memberIds array→csv; TAB_HEADERS มีครบ 6 tab
- [ ] impl: TAB_HEADERS (Users/Teams/Projects/Tasks/ActivityLog/Config) + parse/serialize per entity (csv split/join, Number(), === 'true')
- [ ] commit `feat: add sheet schema parse/serialize with tests`

## Task 2: Repository write ops + seed

**Files:** `lib/sheets/repository.ts`

- [ ] getTabWithRowNumbers(tab) → rows + sheet row index; updateRowById(tab, id, obj, header) หา row จาก id แล้ว values.update ช่วง `A{n}`; ensureTabsAndHeaders() สร้าง tab ที่ขาด (batchUpdate addSheet) + เขียน header แถวแรก
- [ ] commit `feat: add sheet write ops and tab seeding`

## Task 3: Real data path ใน providers

**Files:** `lib/data/dashboard.ts`, `project.ts`, `admin.ts`

- [ ] เมื่อมี service account → getTab ทุก tab, parse เป็น typed, join projects+tasks+users; ไม่งั้น fixtures (คงเดิม)
- [ ] commit `feat: read dashboard/project/admin data from sheets`

## Task 4: Auth — provision + session role + gate

**Files:** `lib/auth/config.ts`, `lib/auth/session.ts`

- [ ] signIn callback: ถ้าอีเมลผ่านโดเมน → provisionUser (ถ้าไม่มีใน Users tab ให้ append ด้วย role จาก initialRoleFor); jwt/session แนบ userId+role; authorized callback บังคับล็อกอินทุกหน้า (ยกเว้น /login, /api/auth)
- [ ] getCurrentUser(): อ่าน session → คืน User
- [ ] commit `feat: provision users on login and gate routes`

## Task 5: Server actions (persistence + optimistic lock)

**Files:** `app/actions/tasks.ts`, `app/actions/admin.ts`

- [ ] editTaskAction(taskId, changes, expectedUpdatedAt): ตรวจสิทธิ์ (getCurrentUser + canEditTask), โหลด task, ถ้า updatedAt ≠ expected → throw conflict; applyTaskEdit; updateRowById(Tasks); append logs → ActivityLog; revalidatePath
- [ ] moveTaskAction(taskId, toColumn): เหมือนกัน + makeMoveLog
- [ ] admin actions: setRoleAction (canManageMembers), team ops → updateRowById(Teams)/append
- [ ] commit `feat: add server actions for task and admin mutations`

## Task 6: Seed route + UI wiring

**Files:** `app/api/seed/route.ts`, แก้ UI components

- [ ] /api/seed (POST, header `x-seed-secret` = env SEED_SECRET): ensureTabsAndHeaders + ถ้า tab ว่าง เขียน fixtures เป็นข้อมูลเริ่มต้น
- [ ] KanbanBoard/MembersTable/TeamsManager: เรียก server action (ใช้ startTransition) แทน setState ล้วน (optimistic update + refetch)
- [ ] commit `feat: add seed route and wire UI to server actions`

## Task 7: Setup guide + verify

**Files:** `docs/superpowers/SETUP-google-sheets.md`

- [ ] เขียนคู่มือ: สร้าง GCP project, enable Sheets API, service account + key, แชร์ Sheet, OAuth client, env
- [ ] `npm test` + `npm run build` ผ่าน (fixtures fallback)
- [ ] เมื่อผู้ใช้ใส่ credential: POST /api/seed → เปิด /api/health เขียว → ล็อกอิน → เห็น/แก้ข้อมูลจริง
- [ ] commit `chore: complete Phase 4 google sheets integration`
