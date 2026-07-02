'use client'

import { useState, useTransition } from 'react'
import { clearCacheAction } from '@/app/actions/config'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID

export function DataTools() {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState('')

  function clearCache() {
    setMsg('')
    start(async () => {
      const res = await clearCacheAction()
      setMsg(res.ok ? 'ล้าง cache แล้ว — ข้อมูลจะดึงสดจาก Sheet ครั้งถัดไป' : res.error || 'ไม่สำเร็จ')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={clearCache}
        disabled={pending}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
      >
        🧹 {pending ? 'กำลังล้าง…' : 'ล้าง cache'}
      </button>
      {SHEET_ID && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
        >
          ↗ เปิด Google Sheet
        </a>
      )}
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  )
}
