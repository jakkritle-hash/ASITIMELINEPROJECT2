import { getSheetsClient, getSheetId } from './client'

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
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: tab,
    valueInputOption: 'RAW',
    requestBody: { values: [objectToRow(obj, header)] },
  })
}
