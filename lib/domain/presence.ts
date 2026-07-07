export type PresenceState = 'active' | 'idle' | 'offline'

/** ถือว่า "กำลังดูอยู่" ถ้า active ภายใน 90 วิ; "ออนไลน์" (ล็อกอินค้าง) ถ้า heartbeat ภายใน 150 วิ */
export const ACTIVE_MS = 90_000
export const ONLINE_MS = 150_000

/**
 * สถานะการใช้งานจากเวลา heartbeat ล่าสุด
 * - active = เปิดแท็บและกำลังดู (lastActiveAt สดใหม่)
 * - idle   = ล็อกอินค้าง/แท็บเปิดแต่ไม่ได้ดู (heartbeat สด แต่ active เก่า) → สีเทาจาง
 * - offline= ไม่มี heartbeat สด → ไม่ต้องแสดง
 */
export function presenceState(lastSeenAt: string | undefined, lastActiveAt: string | undefined, now: number): PresenceState {
  const seen = lastSeenAt ? Date.parse(lastSeenAt) : NaN
  if (isNaN(seen) || now - seen > ONLINE_MS) return 'offline'
  const act = lastActiveAt ? Date.parse(lastActiveAt) : NaN
  if (!isNaN(act) && now - act <= ACTIVE_MS) return 'active'
  return 'idle'
}
