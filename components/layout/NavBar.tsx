import Link from 'next/link'

export function NavBar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 py-2.5 text-sm">
        <span className="mr-4 font-semibold text-gray-900">🗂️ Project Tracker</span>
        <Link href="/" className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100">Dashboard</Link>
        <Link href="/admin/members" className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100">สมาชิก</Link>
        <Link href="/admin/teams" className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100">ทีม</Link>
      </div>
    </nav>
  )
}
