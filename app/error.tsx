'use client'

/** หน้าจัดการ error ระดับแอป — เช่น Sheets API ล่ม/ติดโควตาชั่วคราว ให้ผู้ใช้กดลองใหม่ได้เอง */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 text-center">
      <div className="animate-rise relative overflow-hidden rounded-2xl bg-white/85 px-10 py-10 shadow-[0_2px_4px_rgba(15,23,42,0.05),0_24px_48px_-16px_rgba(244,63,94,0.18)] ring-1 ring-slate-900/[0.06] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
        <div className="mb-3 text-4xl">⚠️</div>
        <h1 className="text-lg font-semibold text-gray-900">เกิดข้อผิดพลาดชั่วคราว</h1>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          อาจเป็นการเชื่อมต่อฐานข้อมูล (Google Sheet) ขัดข้องหรือติดลิมิตชั่วคราว — ลองใหม่อีกครั้งได้เลย
        </p>
        {error.digest && <p className="mt-2 font-mono text-[10px] text-gray-300">ref: {error.digest}</p>}
        <button
          onClick={reset}
          className="btn-shine btn-press mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/25"
        >
          ↻ ลองใหม่
        </button>
      </div>
    </main>
  )
}
