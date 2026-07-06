'use client'

import type { ProjectKind } from '@/lib/domain/types'

const OPTIONS: { value: ProjectKind; label: string; hint: string }[] = [
  { value: 'main', label: 'Main', hint: 'นับคะแนน Performance' },
  { value: 'expand', label: 'Expand', hint: 'งานเสริม — ไม่นับคะแนน' },
]

/** ปุ่มสลับ Main / Expand แบบ segmented — ใช้ทั้งตอนสร้างและบนหน้าโปรเจกต์ */
export function KindToggle({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: {
  value: ProjectKind
  onChange: (k: ProjectKind) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 ring-1 ring-gray-200">
      {OPTIONS.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => !disabled && !active && onChange(o.value)}
            disabled={disabled}
            title={o.hint}
            aria-pressed={active}
            className={
              `btn-press rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${pad} ` +
              (active
                ? o.value === 'main'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm'
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700')
            }
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
