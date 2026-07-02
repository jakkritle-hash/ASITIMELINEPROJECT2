'use client'

import { useState, useTransition } from 'react'
import type { Weights } from '@/lib/domain/performance'
import { setWeightsAction } from '@/app/actions/config'

const FIELDS: { key: keyof Weights; label: string; hint: string }[] = [
  { key: 'departmentLoad', label: 'Department', hint: 'ต่อ 1 แผนกที่โปรเจกต์ใช้' },
  { key: 'taskDone', label: 'งานส่งตรงเวลา', hint: 'ต่อ 1 งานที่ปิดจบ' },
  { key: 'onTimeRate', label: 'อัตราตรงเวลา %', hint: 'ต่อ 1% ในโปรเจกต์' },
  { key: 'workingDays', label: 'วันทำการ', hint: 'ต่อ 1 วัน' },
  { key: 'overdue', label: 'งานเลยกำหนด', hint: 'ต่อ 1 งาน (ควรติดลบ)' },
]

export function WeightsEditor({ initial }: { initial: Weights }) {
  const [w, setW] = useState<Weights>(initial)
  const [saved, setSaved] = useState<Weights>(initial)
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')

  const dirty = JSON.stringify(w) !== JSON.stringify(saved)

  function save() {
    setErr('')
    start(async () => {
      const res = await setWeightsAction(w)
      if (!res.ok) setErr(res.error || 'บันทึกไม่สำเร็จ')
      else setSaved(w)
    })
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] font-medium text-gray-500">{f.label}</span>
            <input
              type="number"
              step="0.5"
              value={w[f.key]}
              onChange={(e) => setW({ ...w, [f.key]: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-center font-mono text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50"
            />
            <span className="mt-1 block text-[10px] text-gray-400">{f.hint}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          {pending ? 'กำลังบันทึก…' : dirty ? 'บันทึกน้ำหนัก' : 'บันทึกแล้ว'}
        </button>
        <button
          onClick={() => setW(saved)}
          disabled={pending || !dirty}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
        >
          ยกเลิกการแก้ไข
        </button>
        {err && <span className="text-xs text-red-500">{err}</span>}
      </div>
    </div>
  )
}
