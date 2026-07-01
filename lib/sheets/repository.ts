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
