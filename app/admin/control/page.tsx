import { getAppConfig } from '@/lib/data/config'
import { getDashboardData } from '@/lib/data/dashboard'
import { getCurrentUser } from '@/lib/auth/session'
import { canAccessPage, canManageMembers } from '@/lib/domain/permissions'
import { setDepartmentsAction, setHolidaysAction, setKanbanColumnsAction } from '@/app/actions/config'
import { ListEditor } from '@/components/admin/ListEditor'
import { WeightsEditor } from '@/components/admin/WeightsEditor'
import { DataTools } from '@/components/admin/DataTools'
import { OverdueMatrix } from '@/components/admin/OverdueMatrix'
import { NoAccess } from '@/components/layout/NoAccess'
import { PageHero } from '@/components/ui/PageHero'

export const dynamic = 'force-dynamic'

export default async function ControlDataPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (!canAccessPage(user, 'control')) return <NoAccess user={user} />
  const canEdit = canManageMembers(user)

  const [config, dashboard] = await Promise.all([getAppConfig(), getDashboardData()])
  const overdueRows = dashboard.projects.map((p) => ({ id: p.id, name: p.name, kind: p.kind, overduePenalty: p.overduePenalty !== false }))

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <PageHero
        title="Control Data"
        badge="🎛️"
        gradient="from-slate-600 to-slate-800"
        shadow="shadow-slate-500/30"
        subtitle="ศูนย์ควบคุมข้อมูลหลักของเว็บ — แก้แล้วมีผลทันทีทุกหน้า (เฉพาะ Admin)"
      >
        {!canEdit && <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-500">Read-only</span>}
      </PageHero>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))]">
        <Section
          title="Departments"
          desc="แผนกที่เลือกได้ในโปรเจกต์ + ใช้คิด Department load ในคะแนน"
          badge={`${config.departments.length} แผนก`}
        >
          <ListEditor initial={config.departments} onSave={setDepartmentsAction} placeholder="เช่น Digital, Airport…" readOnly={!canEdit} />
        </Section>

        <Section
          title="Scoring Weights · Main"
          desc="น้ำหนักคะแนน Performance ของโปรเจกต์ Main (โปรเจกต์หลัก)"
          badge="ปรับสด"
        >
          <WeightsEditor initial={config.weights} kind="main" readOnly={!canEdit} />
        </Section>

        <Section
          title="Scoring Weights · Expand"
          desc="น้ำหนักคะแนนของโปรเจกต์ Expand (งานต่อยอด) — คิดแยกจาก Main"
          badge="ปรับสด"
        >
          <WeightsEditor initial={config.weightsExpand} kind="expand" readOnly={!canEdit} />
        </Section>

        <Section
          title="Scoring Weights · Maintenance"
          desc="น้ำหนักคะแนนของโปรเจกต์ Maintenance (งานดูแลรักษา) — คิดแยกจาก Main"
          badge="ปรับสด"
        >
          <WeightsEditor initial={config.weightsMaintenance} kind="maintenance" readOnly={!canEdit} />
        </Section>

        <Section
          title="Scoring Weights · Revise"
          desc="น้ำหนักคะแนนของโปรเจกต์ Revise (งานแก้ไข/ปรับปรุง) — คิดแยกจาก Main"
          badge="ปรับสด"
        >
          <WeightsEditor initial={config.weightsRevise} kind="revise" readOnly={!canEdit} />
        </Section>

        <Section
          title="การหักคะแนน Overdue รายโปรเจกต์"
          desc="เลือกว่าโปรเจกต์ไหน 'หักคะแนนความล่าช้า' หรือไม่ — มีผลต่อคะแนนรายบุคคลในหน้า Performance ทันที"
          badge={`${overdueRows.filter((r) => r.overduePenalty).length}/${overdueRows.length} หัก`}
        >
          <OverdueMatrix projects={overdueRows} readOnly={!canEdit} />
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
    <section className="animate-rise glass card-sheen rounded-2xl p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="section-tick h-4 w-1 rounded-full" />
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
