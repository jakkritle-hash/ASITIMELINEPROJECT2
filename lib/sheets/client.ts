import { google } from 'googleapis'

/** สร้าง Sheets API client จาก service account ใน env
 *  (PRIVATE_KEY เก็บใน env โดยแทน newline ด้วย \n — แปลงกลับตอนใช้) */
export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export function getSheetId(): string {
  const id = process.env.SHEET_ID
  if (!id) throw new Error('Missing SHEET_ID')
  return id
}
