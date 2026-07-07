import { DEPARTMENTS } from '@/lib/domain/departments'
import { TH_HOLIDAYS } from '@/lib/domain/holidays'
import { WEIGHTS, type Weights } from '@/lib/domain/performance'
import { getConfigMap } from '@/lib/sheets/repository'
import { sheetsConfigured } from './dashboard'

/** คอลัมน์ Kanban ตั้งต้นของโปรเจกต์ใหม่ (ปรับได้ในหน้า Control Data) */
export const DEFAULT_KANBAN_COLUMNS = ['Pending', 'To Do', 'In Progress', 'Review', 'Done']

export interface AppConfig {
  departments: string[]
  holidays: string[]
  kanbanColumns: string[]
  /** น้ำหนักคะแนนแยกตามประเภทโปรเจกต์ */
  weights: Weights // main
  weightsExpand: Weights
  weightsMaintenance: Weights
  weightsRevise: Weights
}

/** ชนิดน้ำหนัก → key ใน Config tab */
export const WEIGHT_KEY = { main: 'weights', expand: 'weightsExpand', maintenance: 'weightsMaintenance', revise: 'weightsRevise' } as const
export type WeightKind = keyof typeof WEIGHT_KEY

const csv = (s?: string): string[] => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [])

function defaults(): AppConfig {
  return {
    departments: [...DEPARTMENTS],
    holidays: [...TH_HOLIDAYS],
    kanbanColumns: [...DEFAULT_KANBAN_COLUMNS],
    weights: { ...WEIGHTS },
    weightsExpand: { ...WEIGHTS },
    weightsMaintenance: { ...WEIGHTS },
    weightsRevise: { ...WEIGHTS },
  }
}

function parseWeights(raw: string | undefined, base: Weights): Weights {
  if (!raw) return base
  try {
    const j = JSON.parse(raw) as Partial<Weights>
    return {
      departmentLoad: Number.isFinite(j.departmentLoad) ? Number(j.departmentLoad) : base.departmentLoad,
      taskDone: Number.isFinite(j.taskDone) ? Number(j.taskDone) : base.taskDone,
      onTimeRate: Number.isFinite(j.onTimeRate) ? Number(j.onTimeRate) : base.onTimeRate,
      workingDays: Number.isFinite(j.workingDays) ? Number(j.workingDays) : base.workingDays,
      overdue: Number.isFinite(j.overdue) ? Number(j.overdue) : base.overdue,
    }
  } catch {
    return base
  }
}

/**
 * ค่าตั้งค่าทั้งหมดของเว็บ — จาก Config tab ถ้ามี ไม่งั้น fallback เป็นค่าคงที่ในโค้ด
 * key ที่ "ไม่มี" ใน Config → ใช้ default ; key ที่มีแต่ว่าง ('') → ถือว่าตั้งค่าเป็น "ว่าง" จริง
 */
export async function getAppConfig(): Promise<AppConfig> {
  const base = defaults()
  if (!sheetsConfigured()) return base
  try {
    const m = await getConfigMap()
    return {
      departments: m.departments != null ? csv(m.departments) : base.departments,
      holidays: m.holidays != null ? csv(m.holidays) : base.holidays,
      kanbanColumns: m.kanbanColumns != null ? csv(m.kanbanColumns) : base.kanbanColumns,
      weights: parseWeights(m.weights, base.weights),
      weightsExpand: parseWeights(m.weightsExpand, base.weightsExpand),
      weightsMaintenance: parseWeights(m.weightsMaintenance, base.weightsMaintenance),
      weightsRevise: parseWeights(m.weightsRevise, base.weightsRevise),
    }
  } catch {
    return base
  }
}
