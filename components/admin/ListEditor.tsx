'use client'

import { useState, useTransition } from 'react'

type SaveAction = (items: string[]) => Promise<{ ok: boolean; error?: string }>

/** ตัวแก้ไขลิสต์ทั่วไป — เพิ่ม/ลบรายการแล้วบันทึกลง Config (ใช้กับ Department/วันหยุด/คอลัมน์ Kanban) */
export function ListEditor({
  initial,
  onSave,
  placeholder,
  inputType = 'text',
  mono,
}: {
  initial: string[]
  onSave: SaveAction
  placeholder: string
  inputType?: 'text' | 'date'
  mono?: boolean
}) {
  const [items, setItems] = useState<string[]>(initial)
  const [saved, setSaved] = useState<string[]>(initial)
  const [input, setInput] = useState('')
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')

  const dirty = items.join('|') !== saved.join('|')

  function add() {
    const v = input.trim()
    if (!v) return
    if (items.includes(v)) {
      setErr('มีรายการนี้อยู่แล้ว')
      return
    }
    setErr('')
    setItems([...items, v])
    setInput('')
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }
  function save() {
    setErr('')
    start(async () => {
      const res = await onSave(items)
      if (!res.ok) setErr(res.error || 'บันทึกไม่สำเร็จ')
      else setSaved(items)
    })
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-[11px] text-gray-400">— ยังไม่มีรายการ —</span>}
        {items.map((it, i) => (
          <span
            key={`${it}-${i}`}
            className={`group inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 py-1 pl-2.5 pr-1 text-xs text-indigo-700 ${mono ? 'font-mono' : ''}`}
          >
            {it}
            <button
              onClick={() => remove(i)}
              disabled={pending}
              className="flex h-4 w-4 items-center justify-center rounded-full text-indigo-400 transition hover:bg-indigo-200 hover:text-indigo-700"
              aria-label={`ลบ ${it}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type={inputType}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className={`w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 ${mono ? 'font-mono' : ''}`}
        />
        <button onClick={add} disabled={pending} className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100">
          + เพิ่ม
        </button>
        <button
          onClick={save}
          disabled={pending || !dirty}
          className="shrink-0 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          {pending ? 'กำลังบันทึก…' : dirty ? 'บันทึก' : 'บันทึกแล้ว'}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  )
}
