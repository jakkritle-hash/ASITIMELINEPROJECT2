import { getAppConfig } from '@/lib/data/config'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage, canManageMembers } from '@/lib/domain/permissions'
import { setDepartmentsAction, setHolidaysAction, setKanbanColumnsAction } from '@/app/actions/config'
import { ListEditor } from '@/components/admin/ListEditor'
import { WeightsEditor } from '@/components/admin/WeightsEditor'
import { DataTools } from '@/components/admin/DataTools'
import { NoAccess } from '@/components/layout/NoAccess'

export const dynamic = 'force-dynamic'

export default async function ControlDataPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'control')) return <NoAccess user={user} />
  const canEdit = canManageMembers(user)

  const config = await getAppConfig()

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-rise mb-5">
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">Control Data</h1>
        <p className="text-xs text-gray-500">ศูนย์ควบคุมข้อมูลหลักของเว็บ — แก้แล้วมีผลทันทีทุกหน้า (เฉพาะ Admin)</p>
        {!canEdit && <span className="mt-2 inline-flex rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-500">Read-only</span>}
      </header>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))]">
        <Section
          title="Departments"
          desc="แผนกที่เลือกได้ในโปรเจกต์ + ใช้คิด Department load ในคะแนน"
          badge={`${config.departments.length} แผนก`}
        >
          <ListEditor initial={config.departments} onSave={setDepartmentsAction} placeholder="เช่น Digital, Airport…" readOnly={!canEdit} />
        </Section>

        <Section
          title="Scoring Weights"
          desc="น้ำหนักคำนวณคะแนน Individual Performance (ต่อโปรเจกต์)"
          badge="ปรับสด"
        >
          <WeightsEditor initial={config.weights} readOnly={!canEdit} />
        </Section>

        <Section
          title="วันหยุด (Thai Holidays)"
          desc="วันที่ถูกตัดออกจากการนับ 'วันทำการ' (นอกเหนือ ส.-อา.)"
          badge={`${config.holidays.length} วัน`}
        >
          <ListEditor initial={config.holidays} onSave={setHolidaysAction} placeholder="YYYY-MM-DD" inputType="date" mono readOnly={!canEdit} />
        </Section>

        <Section
          title="คอลัมน์ Kanban เริ่มต้น"
          desc="คอลัมน์ตั้งต้นเมื่อสร้างโปรเจกต์ใหม่ (เรียงจากซ้าย→ขวา)"
          badge={`${config.kanbanColumns.length} คอลัมน์`}
        >
          <ListEditor initial={config.kanbanColumns} onSave={setKanbanColumnsAction} placeholder="เช่น To Do, Review…" readOnly={!canEdit} />
        </Section>

        <Section title="เครื่องมือข้อมูล (Data Tools)" desc="จัดการ cache และเข้าถึงฐานข้อมูลต้นทาง" badge="Ops">
          <DataTools readOnly={!canEdit} />
        </Section>
      </div>
    </main>
  )
}

function Section({ title, desc, badge, children }: { title: string; desc: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="animate-rise rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:ring-indigo-100">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
            {title}
          </h2>
          <p className="text-[11px] text-gray-400">{desc}</p>
        </div>
        {badge && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-500 ring-1 ring-indigo-100">{badge}</span>}
      </div>
      {children}
    </section>
  )
}
