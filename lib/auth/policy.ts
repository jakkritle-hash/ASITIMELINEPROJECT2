import type { Role } from '@/lib/domain/types'

export function isAllowedEmail(email: string, allowedDomain: string): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith('@' + allowedDomain.toLowerCase())
}

export function initialRoleFor(email: string, bootstrapAdmins: string[]): Role {
  return bootstrapAdmins.map((e) => e.toLowerCase()).includes(email.toLowerCase()) ? 'Admin' : 'Member'
}
