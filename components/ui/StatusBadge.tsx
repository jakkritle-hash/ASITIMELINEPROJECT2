import type { SlaStatus } from '@/lib/domain/types'

export interface StatusMeta {
  color: string
  bg: string
  fg: string
  symbol: string
  label: string
}

export const STATUS_META: Record<SlaStatus, StatusMeta> = {
  'on-track': { color: '#22b07d', bg: '#eef7f2', fg: '#22b07d', symbol: '✓', label: 'On-track' },
  'at-risk': { color: '#f5a623', bg: '#fff3e0', fg: '#d68910', symbol: '⚠', label: 'At-risk' },
  overdue: { color: '#e5484d', bg: '#fde8e8', fg: '#e5484d', symbol: '✕', label: 'Overdue' },
  done: { color: '#9aa0a6', bg: '#eef0f3', fg: '#6b7280', symbol: '✔', label: 'Done' },
}

export function StatusBadge({ status }: { status: SlaStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      <span>{m.symbol}</span>
      {m.label}
    </span>
  )
}
