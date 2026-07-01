import { NextResponse } from 'next/server'
import { getTab } from '@/lib/sheets/repository'

const REQUIRED_TABS = ['Users', 'Teams', 'Projects', 'Tasks', 'ActivityLog', 'Config']

export async function GET() {
  const result: { ok: boolean; tabs: Record<string, unknown> } = { ok: true, tabs: {} }
  try {
    for (const tab of REQUIRED_TABS) {
      try {
        const rows = await getTab(tab)
        result.tabs[tab] = { ok: true, rows: rows.length }
      } catch (e) {
        result.ok = false
        result.tabs[tab] = { ok: false, error: (e as Error).message }
      }
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
