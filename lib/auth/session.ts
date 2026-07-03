import type { User } from '@/lib/domain/types'
import { auth } from './config'
import { getAdminData } from '@/lib/data/admin'
import { FIXTURE_USERS } from '@/lib/data/fixtures'

/**
 * ผู้ใช้ปัจจุบันจาก session — คืน null ถ้าไม่ได้ล็อกอินและระบบ auth เปิดอยู่
 * โหมด dev (ยังไม่ตั้ง OAuth): คืนผู้ใช้ตัวอย่างคนแรกเพื่อให้ทดสอบ flow ได้
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  const email = session?.user?.email

  if (!email) {
    // dev/demo fallback เมื่อยังไม่ได้เปิด OAuth login:
    // ทำหน้าที่เป็น "Admin" (คุณคือผู้ดูแลตาม BOOTSTRAP_ADMIN_EMAILS) เพื่อให้จัดการทีม/สมาชิกได้
    // เมื่อเปิด AUTH_GOOGLE_ID จริง จะใช้ session จริงแทน (สิทธิ์ตาม role ใน Users tab)
    if (!process.env.AUTH_GOOGLE_ID) return { ...FIXTURE_USERS[0], role: 'Admin' }
    return null
  }

  const { users } = await getAdminData()
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  // บัญชีที่ถูกปิดการเข้าใช้งาน → ปฏิบัติเสมือนไม่มีสิทธิ์ (session เดิมถูกตัดในการนำทางครั้งถัดไป)
  if (found && !found.active) return null
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
    pageAccess: [],
  }
}
