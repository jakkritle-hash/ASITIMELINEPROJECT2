'use client'

import { DEPARTMENTS } from '@/lib/domain/departments'

/** ตัวเลือก Department แบบ chip กดสลับ เลือกได้หลายแผนก (controlled)
 *  options = รายการแผนกจาก Control Data (ค่าเริ่มต้น = DEPARTMENTS คงที่) */
export function DepartmentPicker({
  value,
  onChange,
  disabled,
  options = DEPARTMENTS,
}: {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  options?: readonly string[]
}) {
  const selected = new Set(value)
  function toggle(dept: string) {
    if (disabled) return
    const next = new Set(selected)
    if (next.has(dept)) next.delete(dept)
    else next.add(dept)
    // คงลำดับตาม options เสมอ
    onChange(options.filter((d) => next.has(d)))
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.length === 0 && (
        <span className="text-[11px] text-gray-400">— ยังไม่มี Department (เพิ่มได้ที่หน้า Control Data) —</span>
      )}
      {options.map((d) => {
        const on = selected.has(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            disabled={disabled}
            aria-pressed={on}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
              on
                ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {on ? '✓ ' : ''}
            {d}
          </button>
        )
      })}
    </div>
  )
}
