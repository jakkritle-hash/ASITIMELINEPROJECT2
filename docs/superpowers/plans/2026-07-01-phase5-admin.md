# Phase 5: Admin (Members & Teams) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** หน้า Admin จัดการผู้ใช้ (เปลี่ยนบทบาท Admin/Manager/Member, เปิด/ปิด active) และจัดการทีม (สร้างทีม, เพิ่ม/ลบสมาชิก, ตั้งหัวหน้าทีม)

**Architecture:** Logic แก้ไขบทบาท/ทีมเป็นฟังก์ชันบริสุทธิ์ใน `lib/domain/adminOps.ts` (TDD). UI เป็น client components ทำงานบน fixtures (การเขียนกลับ Sheet ต่อในเฟส Google Sheet). เพิ่ม nav bar เชื่อม Dashboard ↔ Admin

**Tech Stack:** Next.js App Router, React client components, Tailwind, Vitest

---

## File Structure

- `lib/domain/adminOps.ts` (+test) — updateUserRole, toggleUserActive, createTeam, addTeamMember, removeTeamMember, setTeamLead
- `lib/data/fixtures.ts` — เพิ่ม FIXTURE_TEAMS
- `lib/data/admin.ts` — getAdminData(): { users, teams }
- `components/layout/NavBar.tsx` — ลิงก์ Dashboard / Members / Teams
- แก้ `app/layout.tsx` — ใส่ NavBar
- `components/admin/MembersTable.tsx` — ตารางผู้ใช้ + เปลี่ยน role + toggle active
- `components/admin/TeamsManager.tsx` — จัดการทีม
- `app/admin/members/page.tsx`, `app/admin/teams/page.tsx`

---

## Task 1: Admin operations (pure, TDD)

**Files:** `lib/domain/adminOps.ts`, `lib/domain/adminOps.test.ts`

- [ ] Step 1 — test:
```typescript
import { describe, it, expect } from 'vitest'
import { updateUserRole, toggleUserActive, createTeam, addTeamMember, removeTeamMember, setTeamLead } from './adminOps'
import type { User, Team } from './types'

const users: User[] = [
  { id: 'u1', email: 'a@x.co', name: 'A', role: 'Member', avatarColor: '#000', active: true, createdAt: '' },
  { id: 'u2', email: 'b@x.co', name: 'B', role: 'Member', avatarColor: '#111', active: true, createdAt: '' },
]
const teams: Team[] = [{ id: 't1', name: 'Marketing', memberIds: ['u1'], leadUserId: 'u1', createdAt: '' }]

describe('user ops', () => {
  it('เปลี่ยนบทบาทผู้ใช้', () => {
    expect(updateUserRole(users, 'u1', 'Admin').find((u) => u.id === 'u1')!.role).toBe('Admin')
  })
  it('สลับ active', () => {
    expect(toggleUserActive(users, 'u1').find((u) => u.id === 'u1')!.active).toBe(false)
  })
})

describe('team ops', () => {
  it('สร้างทีมใหม่ต่อท้าย', () => {
    const next = createTeam(teams, 't2', 'Dev', '2026-07-01')
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ id: 't2', name: 'Dev', memberIds: [], leadUserId: '' })
  })
  it('เพิ่มสมาชิก (ไม่ซ้ำ)', () => {
    const next = addTeamMember(teams, 't1', 'u2')
    expect(next[0].memberIds).toEqual(['u1', 'u2'])
    expect(addTeamMember(next, 't1', 'u2')[0].memberIds).toEqual(['u1', 'u2'])
  })
  it('ลบสมาชิก และถ้าเป็นหัวหน้าให้เคลียร์ lead', () => {
    const next = removeTeamMember(teams, 't1', 'u1')
    expect(next[0].memberIds).toEqual([])
    expect(next[0].leadUserId).toBe('')
  })
  it('ตั้งหัวหน้าทีม (ต้องเป็นสมาชิกก่อน)', () => {
    const withMember = addTeamMember(teams, 't1', 'u2')
    expect(setTeamLead(withMember, 't1', 'u2')[0].leadUserId).toBe('u2')
    expect(setTeamLead(teams, 't1', 'u2')[0].leadUserId).toBe('u1') // u2 ยังไม่ใช่สมาชิก → ไม่เปลี่ยน
  })
})
```
- [ ] Step 2 — run FAIL
- [ ] Step 3 — impl (ทุกฟังก์ชันคืน array ใหม่แบบ immutable)
- [ ] Step 4 — run PASS
- [ ] Step 5 — commit `feat: add admin ops (user role/active, team membership) with tests`

---

## Task 2: Team fixtures + admin data provider

**Files:** `lib/data/fixtures.ts` (แก้), `lib/data/admin.ts`

- [ ] เพิ่ม `FIXTURE_TEAMS`: t1 Marketing (u1,u2,u5 lead u1), t2 Dev (u3,u4 lead u3)
- [ ] `getAdminData()`: คืน { users: FIXTURE_USERS, teams: FIXTURE_TEAMS }
- [ ] commit `feat: add team fixtures and admin data provider`

---

## Task 3: NavBar + layout

**Files:** `components/layout/NavBar.tsx`, `app/layout.tsx` (แก้)

- [ ] NavBar: ลิงก์ Dashboard / สมาชิก / ทีม (ใช้ Link)
- [ ] layout: ใส่ `<NavBar />` เหนือ children (ยกเว้นหน้า login — ยอมรับได้ถ้าโชว์ทุกหน้าในเฟสนี้)
- [ ] commit `feat: add nav bar`

---

## Task 4: MembersTable + page

**Files:** `components/admin/MembersTable.tsx`, `app/admin/members/page.tsx`

- [ ] MembersTable (client): ตาราง (avatar, ชื่อ, อีเมล, role dropdown, ปุ่ม active/inactive); state ภายใน
- [ ] page (server): getAdminData → `<MembersTable users=… />` + หมายเหตุ "โหมดตัวอย่าง"
- [ ] commit `feat: add members management page`

---

## Task 5: TeamsManager + page

**Files:** `components/admin/TeamsManager.tsx`, `app/admin/teams/page.tsx`

- [ ] TeamsManager (client): รายการทีม + ฟอร์มสร้างทีม + ต่อทีม: เพิ่ม/ลบสมาชิก (จาก dropdown ผู้ใช้), ตั้งหัวหน้า (badge ⭐)
- [ ] page (server): getAdminData → `<TeamsManager users=… teams=… />`
- [ ] commit `feat: add teams management page`

---

## Task 6: Verify

- [ ] `npm test` — PASS
- [ ] `npm run build` — ผ่าน
- [ ] `npm run dev` → /admin/members เปลี่ยน role/active; /admin/teams สร้างทีม+เพิ่มสมาชิก+ตั้งหัวหน้า
- [ ] commit `chore: complete Phase 5 admin`
