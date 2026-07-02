'use client'

import { DEPARTMENTS } from '@/lib/domain/departments'

/** ตัวเลือก Department แบบ chip กดสลับ เลือกได้หลายแผนก (controlled) */
export function DepartmentPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const selected = new Set(value)
  function toggle(dept: string) {
    if (disabled) return
    const next = new Set(selected)
    if (next.has(dept)) next.delete(dept)
    else next.add(dept)
    // คงลำดับตาม DEPARTMENTS เสมอ
    onChange(DEPARTMENTS.filter((d) => next.has(d)))
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {DEPARTMENTS.map((d) => {
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
