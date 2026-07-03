'use client'

import { useState, useTransition } from 'react'
import type { Weights } from '@/lib/domain/performance'
import { setWeightsAction } from '@/app/actions/config'

const FIELDS: { key: keyof Weights; label: string; short: string; hint: string }[] = [
  { key: 'departmentLoad', label: 'Department', short: 'Dept', hint: 'ต่อ 1 แผนกที่โปรเจกต์ใช้' },
  { key: 'taskDone', label: 'งานส่งตรงเวลา', short: 'Done', hint: 'ต่อ 1 งานที่ปิดจบ' },
  { key: 'onTimeRate', label: 'อัตราตรงเวลา %', short: 'OnTime%', hint: 'ต่อ 1% ในโปรเจกต์' },
  { key: 'workingDays', label: 'วันทำการ', short: 'Days', hint: 'ต่อ 1 วัน' },
  { key: 'overdue', label: 'งานเลยกำหนด', short: 'Overdue', hint: 'ต่อ 1 งาน (ควรติดลบ)' },
]

export function WeightsEditor({ initial, readOnly = false }: { initial: Weights; readOnly?: boolean }) {
  const [w, setW] = useState<Weights>(initial)
  const [saved, setSaved] = useState<Weights>(initial)
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')

  const dirty = JSON.stringify(w) !== JSON.stringify(saved)

  function save() {
    if (readOnly) return
    setErr('')
    start(async () => {
      const res = await setWeightsAction(w)
      if (!res.ok) setErr(res.error || 'บันทึกไม่สำเร็จ')
      else setSaved(w)
    })
  }

  return (
    <div>
      {/* พรีวิวสูตรสด — สะท้อนน้ำหนักที่กำลังตั้ง */}
      <div className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50/60 px-3 py-2 text-[11px] text-gray-500 ring-1 ring-indigo-100/70">
        <span className="font-semibold text-gray-600">score =</span>
        {FIELDS.map((f, i) => {
          const v = w[f.key]
          return (
            <span key={f.key} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-gray-400">{v < 0 ? '−' : '+'}</span>}
              <span>{f.short}</span>
              <span className="font-mono font-semibold text-indigo-600">×{Math.abs(v)}</span>
            </span>
          )
        })}
      </div>

      {/* ไทล์น้ำหนัก — label/hint สูงคงที่ ช่องกรอกเรียงตรงกันเสมอ */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {FIELDS.map((f) => (
          <label
            key={f.key}
            className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-center transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-200/50"
          >
            <span className="flex min-h-[30px] items-center justify-center text-[11px] font-medium leading-tight text-gray-500">{f.label}</span>
            <input
              type="number"
              step="0.5"
              value={w[f.key]}
              onChange={(e) => setW({ ...w, [f.key]: Number(e.target.value) })}
              disabled={readOnly}
              className="mt-1 w-full rounded-lg bg-white py-1.5 text-center font-mono text-lg font-semibold text-gray-900 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-100 disabled:text-gray-400"
            />
            <span className="mt-1.5 flex min-h-[26px] items-center justify-center text-[10px] leading-tight text-gray-400">{f.hint}</span>
          </label>
        ))}
      </div>
      {!readOnly && <div className="mt-3 flex items-center gap-3">
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
      </div>}
    </div>
  )
}
