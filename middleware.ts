import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth/base'

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/((?!api/auth|api/health|api/seed|_next/static|_next/image|favicon.ico|login).*)'],
}
