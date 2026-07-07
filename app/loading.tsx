/** โครงหน้าระหว่างโหลด (ทุก route) — ลดความรู้สึกหน้าค้างตอนดึงข้อมูลจาก Sheet */
export default function Loading() {
  return (
    <main className="w-full animate-pulse px-4 py-6 sm:px-6 lg:px-8">
      {/* หัวข้อ */}
      <div className="mb-5">
        <div className="h-6 w-44 rounded-lg bg-slate-200/80" />
        <div className="mt-2 h-3 w-72 rounded bg-slate-200/60" />
      </div>

      {/* แถวการ์ดตัวเลข */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
            <div className="h-10 w-10 rounded-xl bg-slate-200/80" />
            <div className="flex-1">
              <div className="h-4 w-16 rounded bg-slate-200/80" />
              <div className="mt-1.5 h-3 w-24 rounded bg-slate-200/60" />
            </div>
          </div>
        ))}
      </div>

      {/* กล่องเนื้อหาหลัก */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 h-4 w-40 rounded bg-slate-200/80" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-48 shrink-0 rounded bg-slate-200/70" />
              <div className="h-3 rounded-full bg-slate-200/50" style={{ width: `${30 + ((i * 17) % 45)}%`, marginLeft: `${(i * 13) % 25}%` }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
