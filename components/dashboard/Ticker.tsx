/**
 * แถบสถิติวิ่งแบบจอ LED billboard (OOH identity) — pure CSS marquee
 * เนื้อหาซ้ำ 2 ชุดเพื่อ loop ไร้รอยต่อ; hover เพื่อหยุดอ่าน
 */
export function Ticker({ items }: { items: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }[] }) {
  const TONE: Record<string, string> = {
    ok: 'text-emerald-600',
    warn: 'text-amber-600',
    bad: 'text-rose-600',
  }
  const strip = (
    <>
      {items.map((it, i) => (
        <span key={i} className="inline-flex shrink-0 items-center gap-2 px-5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{it.label}</span>
          <span className={`font-mono text-sm font-bold tabular-nums ${it.tone ? TONE[it.tone] : 'text-slate-800'}`}>{it.value}</span>
          <span className="ml-3 inline-block h-1 w-1 rotate-45 bg-indigo-300" aria-hidden />
        </span>
      ))}
    </>
  )
  return (
    <div className="ticker-wrap glass mb-4 rounded-xl py-2" role="marquee" aria-label="สรุปสถิติแบบเลื่อน">
      <div className="ticker">
        <div className="flex shrink-0 items-center">{strip}</div>
        <div className="flex shrink-0 items-center" aria-hidden>{strip}</div>
      </div>
    </div>
  )
}
