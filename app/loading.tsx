/** โครงหน้าระหว่างโหลด (ทุก route) — skeleton แบบแสงกวาด ลดความรู้สึกหน้าค้างตอนดึงข้อมูลจาก Sheet */
export default function Loading() {
  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      {/* หัวข้อ */}
      <div className="mb-5 flex items-center gap-3">
        <div className="skeleton h-11 w-11 rounded-2xl" />
        <div>
          <div className="skeleton h-6 w-44 rounded-lg" />
          <div className="skeleton mt-2 h-3 w-72 rounded" />
        </div>
      </div>

      {/* แถวการ์ดตัวเลข */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass flex items-center gap-3 rounded-2xl p-3.5">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton mt-1.5 h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* กล่องเนื้อหาหลัก */}
      <div className="glass rounded-2xl p-4">
        <div className="skeleton mb-4 h-4 w-40 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-3 w-48 shrink-0 rounded" />
              <div className="skeleton h-3 rounded-full" style={{ width: `${30 + ((i * 17) % 45)}%`, marginLeft: `${(i * 13) % 25}%` }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
