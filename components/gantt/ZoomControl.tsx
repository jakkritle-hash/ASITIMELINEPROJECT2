'use client'

import { ZOOM_LEVELS, type ZoomLevel } from '@/lib/domain/timeLayers'

const LABELS: Record<ZoomLevel, string> = {
  year: 'Year',
  quarter: 'Quarter',
  month: 'Month',
  week: 'Week',
  day: 'Day',
}

export function ZoomControl({ zoom, onChange }: { zoom: ZoomLevel; onChange: (z: ZoomLevel) => void }) {
  return (
    <div className="flex items-center gap-1 text-[11px]">
      <span className="mr-1 text-gray-400">Zoom:</span>
      {ZOOM_LEVELS.map((z) => (
        <button
          key={z}
          onClick={() => onChange(z)}
          className={
            'rounded-md px-2.5 py-1 transition ' +
            (z === zoom ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50')
          }
        >
          {LABELS[z]}
        </button>
      ))}
    </div>
  )
}
