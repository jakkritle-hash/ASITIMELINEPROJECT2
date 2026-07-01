import { NextResponse } from 'next/server'
import { ensureTabsAndHeaders, getTab, appendRows } from '@/lib/sheets/repository'
import { serializeUser, serializeTeam, serializeProject, serializeTask, TAB_HEADERS } from '@/lib/sheets/schema'
import { FIXTURE_USERS, FIXTURE_TEAMS, FIXTURE_PROJECTS, FIXTURE_TASKS } from '@/lib/data/fixtures'

/**
 * POST /api/seed — สร้าง 6 tabs + header และเติมข้อมูลตัวอย่างในแท็บที่ยังว่าง
 * ต้องส่ง header `x-seed-secret` ให้ตรงกับ env SEED_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET
  if (!secret || req.headers.get('x-seed-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const { created } = await ensureTabsAndHeaders()
    const seeded: string[] = []

    const seedIfEmpty = async (tab: string, rows: Record<string, unknown>[]) => {
      const existing = await getTab(tab)
      if (existing.length === 0) {
        await appendRows(tab, rows, TAB_HEADERS[tab as keyof typeof TAB_HEADERS] as unknown as string[])
        seeded.push(tab)
      }
    }

    await seedIfEmpty('Users', FIXTURE_USERS.map(serializeUser))
    await seedIfEmpty('Teams', FIXTURE_TEAMS.map(serializeTeam))
    await seedIfEmpty('Projects', FIXTURE_PROJECTS.map(serializeProject))
    await seedIfEmpty('Tasks', FIXTURE_TASKS.map(serializeTask))

    return NextResponse.json({ ok: true, tabsCreated: created, tabsSeeded: seeded })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
