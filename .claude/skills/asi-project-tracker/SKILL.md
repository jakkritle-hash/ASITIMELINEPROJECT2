---
name: asi-project-tracker
description: >-
  Architecture, conventions, and hard-won gotchas for the ASI Project Tracker web app
  (this repo — Plan B Media's internal project-tracking dashboard). Use this skill BEFORE
  writing or editing ANY code in this repository: whenever you touch a page, server action,
  Google-Sheet read/write, add a field to a Project/Task/User, change performance scoring,
  presence, permissions, the Gantt timeline, or deploy. Also use it when a change "saved but
  doesn't show up", a value "reverts to its default", you see "Connection closed" after a
  server action, or you're about to run the app / push to Vercel. It encodes the Sheet-as-DB
  schema-healing rule and the dual-cache invalidation rule that are easy to get wrong and
  cause silent data-loss bugs.
---

# ASI Project Tracker

Internal project-tracking dashboard for **Plan B Media** (out-of-home advertising). Thai/English UI.
Google Sheets is the database. Deployed on Vercel at `asitimelineproject-2.vercel.app`.

## Stack

- **Next.js 16.2.9** — App Router, Turbopack, React **19.2**. Read the deprecation notes: this is
  *not* the Next.js in your training data. When unsure about an API, read `node_modules/next/dist/docs/`
  (per `AGENTS.md`) rather than guessing.
- **TypeScript**, **Tailwind v4** (`@tailwindcss/postcss`), **next-auth v5 beta** (Google OAuth).
- **googleapis** (Sheets v4) as the persistence layer.
- **Vitest** for unit tests (`npm test`). Domain logic is unit-tested; keep it green.
- No component library — hand-rolled components under `components/`.

## Layered architecture

Data flows one direction. Keep logic in the layer it belongs to.

```
app/            Route pages (force-dynamic) + app/actions/* (Server Actions, 'use server')
components/     Client components ('use client') — optimistic UI, call actions
lib/data/       Read-side aggregation (join Sheet tabs → view models) — cached reads
lib/sheets/     DB layer: client (auth), schema (headers/parse/serialize), repository (CRUD + cache)
lib/domain/     Pure functions + types. NO I/O. Fully unit-tested (*.test.ts sit beside source)
lib/auth/       next-auth config, session, provisioning, page policy
```

**Rule:** `lib/domain/*` is pure and has no dependency on Sheets or Next — that's why it's testable.
Put date math, scoring, SLA, permissions, gantt geometry there. `lib/data/*` orchestrates reads;
`app/actions/*` orchestrates writes.

## Google Sheets as the database — READ THIS FIRST

The Sheet has 6 tabs, each with a fixed header row. Column order is defined in
`lib/sheets/schema.ts` → `TAB_HEADERS` (append-only — never reorder or the round-trip breaks):

`Users, Teams, Projects, Tasks, ActivityLog, Config`.

`rowsToObjects` in `lib/sheets/repository.ts` keys each row **by the actual header cells in the Sheet**,
not by `TAB_HEADERS`. This is the source of the most common bug class in this repo.

### The schema auto-heal rule (the "reverts to default" bug)

When you add a field to a domain type (e.g. a new column on `Project`), you must do **all four**:

1. Add it to `TAB_HEADERS` in `schema.ts` (append at the end).
2. Add it to the `parse*` function with a sensible default for empty/legacy rows
   (e.g. `overduePenalty: r.overduePenalty !== 'false'` → defaults true).
3. Add it to the `serialize*` function so writes emit the column.
4. **Extend the matching `ensure*Schema()` function in `repository.ts`** so the missing column is
   appended to the *live Sheet header* on first read.

If you skip step 4, the live Sheet has no such column, so: writes land in an unlabeled trailing cell,
and reads never find the key → every row parses to the default. Symptom: "I set kind=Expand, saved,
and it snapped back to Main." That is a missing header column, not a UI bug.

Existing healers (all hooked in `getTab()` and reset by `invalidateSheetCache()`):
- `ensureUsersPageAccessSchema` → `pageAccess`, `lastSeenAt`, `lastActiveAt` (+ migrates old `pageDenied`).
- `ensureProjectsKindSchema` → `kind`, `order`, `overduePenalty`.
- `ensureTasksCompletedAtSchema` → `completedAt`.

Follow the same shape for any new column.

### Reads, writes, and the two caches

Two independent caches exist. A write path must address **both**.

- **Server-side TTL cache** — `getTabCached(tab)` memoises a tab read for **15s** (with in-flight
  dedupe) to survive the Sheets API quota. Use it for *rendering pages* (`lib/data/*`).
- Use `getTab(tab)` (uncached, also runs the schema healers) for *writes / find-then-update* so you
  act on fresh data.
- After any mutation, call **`invalidateSheetCache()`** — it clears the TTL cache and resets the
  schema-checked flags.
- **Next client Router Cache** — killed globally via `next.config.ts` `experimental.staleTimes:
  { dynamic: 0, static: 0 }` **and** `prefetch={false}` on NavLinks. Without this, navigating between
  pages serves a stale prefetched RSC payload even though the Sheet changed. (Next warns that
  `static:0` is below its floor of 30 — the warning is harmless; `prefetch={false}` is what actually
  fixes cross-page sync.)

CRUD helpers in `repository.ts`: `appendRows`, `updateRowById` (matches col `id`), `deleteRowById`
(real `deleteDimension`, needs the tab gid), `getConfigMap` / `setConfigValue` (Config is key/value,
has no `id`). `ensureTabsAndHeaders` seeds a fresh Sheet.

## Server Actions

All writes are Server Actions in `app/actions/*.ts` (`'use server'`). Canonical shape
(see `app/actions/tasks.ts`):

```ts
export async function editTaskAction(...): Promise<{ ok: boolean; error?: string }> {
  if (!sheetsConfigured()) return { ok: true }          // dev mode: client holds state
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  // ...permission check, load fresh via getTab, mutate, append ActivityLog...
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
  invalidateSheetCache()
  return { ok: true }
}
```

Conventions & landmines:
- Return `{ ok, error }` — never throw across the boundary. Clients revert optimistic state on `!ok`.
- **Never** `revalidatePath('/', 'layout')` in a fire-and-forget action — it caused **"Connection
  closed"** errors. Revalidate the specific affected paths.
- Every meaningful mutation appends to `ActivityLog` (the audit trail). Use `serializeLog`.
- Optimistic lock on edits via `expectedUpdatedAt` → returns a `conflict` error if the row changed
  underneath.
- **Collaboration model:** any authenticated user can create / move / edit Tasks in *any* project
  (these actions gate on `getCurrentUser()` only, not `canEditProject`). Destructive ops (delete)
  and project-level changes gate on `canEditTask` / `canEditProject`.

## Auth & permissions

- `getCurrentUser()` (`lib/auth/session.ts`): reads next-auth session, matches by email against the
  Users tab. **Inactive users (`active:false`) are treated as no session.** Dev fallback: with no
  `AUTH_GOOGLE_ID` set, returns fixture user #0 as **Admin** so the app is usable without OAuth.
- `middleware.ts` protects everything except `api/auth`, `api/health`, `api/seed`, static, `login`.
- Roles: **Admin** (everything, all pages), **Manager** (edit projects in teams they lead),
  **Member** (edit own/member projects). See `lib/domain/permissions.ts`.
- **Security note learned the hard way:** never let a non-Admin assign team leads —
  `setTeamLeadAction` is Admin-only, because a Manager self-assigning as lead is a privilege
  escalation into `canEditProject` over arbitrary projects. Keep role-granting actions Admin-gated.
- Per-page access is an allow-list on `User.pageAccess`; empty = default content pages,
  `['__none__']` = all off. Menu hides inaccessible pages.

## Domain specifics

- **Project kinds** (`ProjectKind`): `main | expand | maintenance | revise`. `toProjectKind()`
  defaults unknown → `main`. Badges/colors live in `components/project/ProjectKind.tsx`.
- **Performance** is scored **separately per kind**, each with its own configurable weights in Control
  Data (`weights`, `weightsExpand`, `weightsMaintenance`, `weightsRevise`). See `lib/domain/performance.ts`
  + `lib/data/performance.ts`.
- **Lateness penalty is proportional**, not flat: a task done *after* its due date is still penalized
  by working-days late. `completedAt` is stamped when a task enters "Done" and cleared when it leaves
  (`completedAtFor`). `lateWorkingDays(due, ref, holidays)` drives the penalty. Per-project toggle
  `overduePenalty` (Control Data → OverdueMatrix) can disable it; that syncs to Performance.
- **Working days** exclude weekends **and** Thai holidays from the Config tab (`lib/domain/workingDays.ts`,
  `holidays.ts`).
- **Presence** (serverless-safe): never store in memory (multi-instance). `lastSeenAt`/`lastActiveAt`
  live on Users rows; client heartbeats ~45s; read through cache. States in
  `lib/domain/presence.ts` (ACTIVE_MS / ONLINE_MS). Navbar shows online users Google-Sheets-style
  (active = color + green dot, idle = grey, offline = hidden).

## Client component pattern

Client components own optimistic state and reconcile against the server:
apply the change locally → call the action → on `!ok` revert and show the error → otherwise let
`revalidatePath` + `router.refresh()` reconcile. Guard per-item with a `saving`/`pending` map so
double-clicks don't race. `OverdueMatrix.tsx` is a compact reference implementation.

## Testing

`npm test` runs Vitest. Domain modules have colocated `*.test.ts`. When you change a domain rule or
a Sheet header/parse/serialize, update the matching test. Pure-domain design is what makes this fast —
don't push I/O into `lib/domain/`.

## Deploy workflow

- **Default: do NOT auto-deploy.** The user's standing instruction is to commit locally, show the
  result at `localhost` (`npm run dev`), and **push only after explicit approval**. Pushing to `main`
  triggers Vercel's git integration = production deploy.
- The Vercel MCP tools are read/observe only (`get_deployment`, `list_deployments`); their
  `deploy_to_vercel` returns instructions, it does not deploy. The real deploy is `git push`.
- Verify a deploy is `READY` via `get_deployment` before telling the user it's live; remind them to
  hard-refresh.

## Quick pre-flight checklist for common changes

- **Adding a field to Project/Task/User** → do the 4 schema steps above (headers, parse, serialize,
  `ensure*Schema` healer). Add/adjust a test.
- **New write action** → gate on `getCurrentUser()`, return `{ ok, error }`, append ActivityLog,
  `revalidatePath(specific)` (never `'/','layout'`), `invalidateSheetCache()`.
- **"Saved but doesn't show"** → missing `invalidateSheetCache()`, or stale Router Cache
  (`prefetch={false}` / `staleTimes`), or a missing Sheet header column.
- **"Connection closed"** → a `revalidatePath('/', 'layout')` in a fire-and-forget action. Remove it.
- **New page** → `export const dynamic = 'force-dynamic'`, add to `lib/domain/pages.ts`, gate with
  `canAccessPage`, add to nav.
