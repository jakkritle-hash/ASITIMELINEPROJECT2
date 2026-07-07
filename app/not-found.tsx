import Link from 'next/link'

/** หน้า 404 — โทนเดียวกับ Login/NoAccess */
export default function NotFound() {
  return (
    <main className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="animate-blob animation-delay-4s absolute -right-12 top-10 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="animate-rise relative overflow-hidden rounded-2xl bg-white/80 px-10 py-10 shadow-[0_2px_4px_rgba(15,23,42,0.05),0_24px_48px_-16px_rgba(79,70,229,0.2)] ring-1 ring-slate-900/[0.06] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400" />
        <div className="font-mono text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">404</span>
        </div>
        <h1 className="mt-2 text-lg font-semibold text-gray-900">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-1 text-sm text-gray-500">ลิงก์อาจถูกลบ ย้าย หรือพิมพ์ที่อยู่ไม่ถูกต้อง</p>
        <Link
          href="/"
          className="btn-shine btn-press mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/25"
        >
          ← กลับหน้า Dashboard
        </Link>
      </div>
    </main>
  )
}
