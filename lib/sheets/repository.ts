import { getSheetsClient, getSheetId } from './client'
import { TAB_HEADERS, type TabName } from './schema'

export function rowsToObjects(values: string[][]): Record<string, string>[] {
  if (!values || values.length < 2) return []
  const [header, ...rows] = values
  return rows.map((row) => {
    const obj: Record<string, string> = {}
    header.forEach((key, i) => {
      obj[key] = row[i] ?? ''
    })
    return obj
  })
}

export function objectToRow(obj: Record<string, unknown>, header: string[]): string[] {
  return header.map((key) => {
    const v = obj[key]
    return v === undefined || v === null ? '' : String(v)
  })
}

/** อ่านทั้ง tab แบบสด (ไม่ cache) — ใช้ในการเขียน/หาแถว เพื่อความถูกต้อง */
export async function getTab(tab: string): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: tab,
  })
  return rowsToObjects((res.data.values as string[][]) ?? [])
}

// ---- Cache แบบ TTL ระดับ module (กัน rate limit ของ Sheets API) ----
const CACHE_TTL_MS = 15_000
type CacheEntry = { data: Record<string, string>[]; expires: number }
const _cache = new Map<string, CacheEntry>()
// dedupe การอ่านที่ค้างอยู่พร้อมกัน ให้ยิง API ครั้งเดียว
const _inflight = new Map<string, Promise<Record<string, string>[]>>()

/**
 * อ่านทั้ง tab แบบมี cache (TTL 15 วิ) — ใช้สำหรับ render หน้าเพจ
 * ลดจำนวน read ต่อ rate limit; ล้างทันทีด้วย invalidateSheetCache() หลังเขียน
 */
export async function getTabCached(tab: string): Promise<Record<string, string>[]> {
  const now = Date.now()
  const hit = _cache.get(tab)
  if (hit && hit.expires > now) return hit.data

  const pending = _inflight.get(tab)
  if (pending) return pending

  const p = getTab(tab)
    .then((data) => {
      _cache.set(tab, { data, expires: Date.now() + CACHE_TTL_MS })
      return data
    })
    .finally(() => _inflight.delete(tab))
  _inflight.set(tab, p)
  return p
}

/** ล้าง cache ทั้งหมด (เรียกหลังการเขียนเพื่อให้เห็นผลทันที) */
export function invalidateSheetCache(): void {
  _cache.clear()
}

/** append หนึ่งแถวต่อท้าย tab ตามลำดับ header */
export async function appendRow(tab: string, obj: Record<string, unknown>, header: string[]): Promise<void> {
  await appendRows(tab, [obj], header)
}

/** append หลายแถวในครั้งเดียว (ลด API call) */
export async function appendRows(tab: string, objs: Record<string, unknown>[], header: string[]): Promise<void> {
  if (objs.length === 0) return
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: tab,
    valueInputOption: 'RAW',
    requestBody: { values: objs.map((o) => objectToRow(o, header)) },
  })
}

/**
 * อัปเดตแถวที่ตรงกับ id (คอลัมน์แรกชื่อ 'id') — คืน false ถ้าไม่พบ
 * หาแถวจากข้อมูลปัจจุบันแล้ว values.update ช่วง `Tab!A{n}`
 */
export async function updateRowById(tab: string, id: string, obj: Record<string, unknown>, header: string[]): Promise<boolean> {
  const rows = await getTab(tab)
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) return false
  const rowNumber = idx + 2 // +1 header, +1 ฐาน 1
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${tab}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [objectToRow(obj, header)] },
  })
  return true
}

/** หา sheetId (gid) ของ tab ตามชื่อ */
async function getGid(tab: string): Promise<number | null> {
  const sheets = getSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSheetId() })
  const s = (meta.data.sheets ?? []).find((x) => x.properties?.title === tab)
  return s?.properties?.sheetId ?? null
}

/** ลบแถวที่ id ตรงออกจริง (deleteDimension) — คืน false ถ้าไม่พบ */
export async function deleteRowById(tab: string, id: string): Promise<boolean> {
  const rows = await getTab(tab)
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) return false
  const gid = await getGid(tab)
  if (gid == null) return false
  const sheets = getSheetsClient()
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId: gid, dimension: 'ROWS', startIndex: idx + 1, endIndex: idx + 2 }, // +1 ข้าม header
          },
        },
      ],
    },
  })
  return true
}

/** สร้าง tab ที่ยังไม่มี + เขียน header แถวแรกให้ครบทั้ง 6 tab (ใช้ตอน seed) */
export async function ensureTabsAndHeaders(): Promise<{ created: string[] }> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title))
  const created: string[] = []

  const toCreate = (Object.keys(TAB_HEADERS) as TabName[]).filter((t) => !existing.has(t))
  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })) },
    })
    created.push(...toCreate)
  }

  for (const tab of Object.keys(TAB_HEADERS) as TabName[]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [TAB_HEADERS[tab] as unknown as string[]] },
    })
  }
  return { created }
}
