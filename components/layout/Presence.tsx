'use client'

import { useCallback, useEffect, useState } from 'react'
import { heartbeatAction, getPresenceAction, type PresenceUser } from '@/app/actions/presence'

const TICK_MS = 45_000
const MAX_SHOWN = 6
const SIZE = 26

/** แถบแสดงคนที่กำลังออนไลน์ (สไตล์ Google) — active = สีปกติ+จุดเขียว, idle = เทาจาง, offline = ไม่โชว์ */
export function Presence() {
  const [users, setUsers] = useState<PresenceUser[]>([])

  const beat = useCallback(async () => {
    try {
      const active = typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()
      await heartbeatAction(active)
      setUsers(await getPresenceAction())
    } catch {
      // เงียบไว้ — presence เป็นของประดับ ไม่ควรรบกวนผู้ใช้ถ้าพลาด
    }
  }, [])

  useEffect(() => {
    void beat()
    const id = window.setInterval(beat, TICK_MS)
    const onVis = () => void beat()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [beat])

  if (users.length === 0) return null

  const shown = users.slice(0, MAX_SHOWN)
  const rest = users.length - shown.length

  return (
    <span className="flex items-center" title="กำลังออนไลน์">
      {shown.map((u, i) => (
        <span key={u.id} className="relative" style={{ marginLeft: i === 0 ? 0 : -8 }} title={`${u.name} · ${u.state === 'active' ? 'กำลังใช้งาน' : 'เปิดค้างไว้ (ไม่ได้ใช้งาน)'}`}>
          <span
            className={
              'inline-flex items-center justify-center rounded-full border-2 border-white font-medium text-white shadow-sm transition ' +
              (u.state === 'idle' ? 'opacity-40 grayscale' : '')
            }
            style={{ width: SIZE, height: SIZE, backgroundColor: u.avatarColor, fontSize: SIZE * 0.4 }}
          >
            {u.name.slice(0, 2)}
          </span>
          {u.state === 'active' && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          )}
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full border-2 border-white bg-gray-300 font-medium text-gray-600"
          style={{ width: SIZE, height: SIZE, fontSize: SIZE * 0.36, marginLeft: -8 }}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}
