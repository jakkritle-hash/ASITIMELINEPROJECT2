'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * โมดัลกึ่งกลางจอ — render ผ่าน portal ไปที่ document.body
 * เพื่อหนี containing block ที่เกิดจาก ancestor ที่มี transform/filter
 * (เช่น .animate-rise) ซึ่งทำให้ position:fixed ไม่อิงกับ viewport
 */
export function Modal({
  open,
  onClose,
  children,
  panelClassName = 'w-full max-w-md',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  panelClassName?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative z-10 max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ${panelClassName}`}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
