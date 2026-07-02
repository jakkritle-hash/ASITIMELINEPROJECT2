/** ทะเบียนหน้าในเว็บ + คีย์สำหรับคุมสิทธิ์การเข้าถึง */
export interface PageDef {
  key: string
  label: string
  href: string
  /** true = หน้าเชิงระบบ เข้าได้เฉพาะ Admin (ไม่ toggle รายคน) */
  admin?: boolean
}

export const PAGES: PageDef[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/' },
  { key: 'performance', label: 'Performance', href: '/performance' },
  { key: 'members', label: 'Team Member', href: '/admin/members', admin: true },
  { key: 'teams', label: 'Team', href: '/admin/teams', admin: true },
  { key: 'control', label: 'Control Data', href: '/admin/control', admin: true },
]

/** หน้าเนื้อหาที่ toggle สิทธิ์รายบุคคลได้ (ไม่ใช่หน้า admin) */
export const CONTENT_PAGES = PAGES.filter((p) => !p.admin)

export function pageByKey(key: string): PageDef | undefined {
  return PAGES.find((p) => p.key === key)
}
