import type { User } from '@/lib/domain/types'
import { auth } from './config'
import { getAdminData } from '@/lib/data/admin'
import { sheetsConfigured } from '@/lib/data/dashboard'
import { FIXTURE_USERS } from '@/lib/data/fixtures'

/**
 * ผู้ใช้ปัจจุบันจาก session — คืน null ถ้าไม่ได้ล็อกอินและระบบ auth เปิดอยู่
 * โหมด dev (ยังไม่ตั้ง OAuth): คืนผู้ใช้ตัวอย่างคนแรกเพื่อให้ทดสอบ flow ได้
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  const email = session?.user?.email

  if (!email) {
    // dev/demo fallback เมื่อยังไม่ได้ต่อ auth จริง
    if (!process.env.AUTH_GOOGLE_ID) return FIXTURE_USERS[0]
    return null
  }

  const { users } = await getAdminData()
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (found) return found

  // มี session แต่ยังไม่พบใน source (เช่น fixtures) → สร้าง object ชั่วคราว
  return {
    id: (session!.user as { id?: string }).id || 'unknown',
    email,
    name: session!.user?.name || email,
    role: (session!.user as { role?: User['role'] }).role || 'Member',
    avatarColor: '#94a3b8',
    active: true,
    createdAt: '',
  }
}
