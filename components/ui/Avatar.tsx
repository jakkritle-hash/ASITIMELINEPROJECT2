import type { User } from '@/lib/domain/types'

export function Avatar({ user, size = 20 }: { user?: User; size?: number }) {
  const initials = user ? user.name.slice(0, 2) : '?'
  const color = user?.avatarColor ?? '#cbd5e1'
  return (
    <span
      title={user?.name}
      className="inline-flex items-center justify-center rounded-full border-2 border-white font-medium text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  )
}

/** กลุ่ม avatar ซ้อนกัน (แสดงทีมรวม) */
export function AvatarGroup({ users, max = 4, size = 20 }: { users: User[]; max?: number; size?: number }) {
  const shown = users.slice(0, max)
  const rest = users.length - shown.length
  return (
    <span className="flex items-center">
      {shown.map((u, i) => (
        <span key={u.id} style={{ marginLeft: i === 0 ? 0 : -6 }}>
          <Avatar user={u} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full border-2 border-white bg-gray-300 font-medium text-gray-600"
          style={{ width: size, height: size, fontSize: size * 0.38, marginLeft: -6 }}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}
