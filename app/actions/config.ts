'use server'

import { revalidatePath } from 'next/cache'
import type { Weights } from '@/lib/domain/performance'
import { WEIGHT_KEY, type WeightKind } from '@/lib/data/config'
import { setConfigValue, invalidateSheetCache } from '@/lib/sheets/repository'
import { canManageMembers } from '@/lib/domain/permissions'
import { getCurrentUser } from '@/lib/auth/session'
import { sheetsConfigured } from '@/lib/data/dashboard'

export interface ActionResult {
  ok: boolean
  error?: string
}

async function requireAdmin(): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  if (!canManageMembers(user)) return { ok: false, error: 'forbidden' }
  return { ok: true }
}

/** ทำความสะอาดรายการ: trim, ตัดค่าว่าง, ตัดซ้ำ (คงลำดับ) */
function cleanList(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const v = raw.trim()
    if (v && !seen.has(v)) {
      seen.add(v)
      out.push(v)
    }
  }
  return out
}

async function saveList(key: string, list: string[], paths: string[]): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  await setConfigValue(key, cleanList(list).join(','))
  invalidateSheetCache()
  paths.forEach((p) => revalidatePath(p))
  return { ok: true }
}

/** รายชื่อ Department ที่เลือกได้ในโปรเจกต์ */
export async function setDepartmentsAction(list: string[]): Promise<ActionResult> {
  return saveList('departments', list, ['/', '/performance', '/admin/control'])
}

/** วันหยุด (YYYY-MM-DD) ที่ใช้คำนวณ "วันทำการ" */
export async function setHolidaysAction(list: string[]): Promise<ActionResult> {
  return saveList('holidays', list, ['/', '/performance', '/admin/control'])
}

/** คอลัมน์ Kanban ตั้งต้นของโปรเจกต์ใหม่ */
export async function setKanbanColumnsAction(list: string[]): Promise<ActionResult> {
  return saveList('kanbanColumns', list, ['/admin/control'])
}

/** น้ำหนักคะแนน Individual Performance — แยกตามประเภทโปรเจกต์ (main/expand/maintenance) */
export async function setWeightsAction(weights: Weights, kind: WeightKind = 'main'): Promise<ActionResult> {
  if (!sheetsConfigured()) return { ok: true }
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  await setConfigValue(WEIGHT_KEY[kind], JSON.stringify(weights))
  invalidateSheetCache()
  revalidatePath('/performance')
  revalidatePath('/admin/control')
  return { ok: true }
}

/** ล้าง cache ฝั่งเซิร์ฟเวอร์ (ให้ดึงข้อมูลสดจาก Sheet ทันที) */
export async function clearCacheAction(): Promise<ActionResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate
  invalidateSheetCache()
  revalidatePath('/', 'layout')
  return { ok: true }
}
