import NextAuth from 'next-auth'
import { authConfig } from './base'
import { isAllowedEmail } from './policy'
import { provisionUser } from './provision'
import { sheetsConfigured } from '@/lib/data/dashboard'

const allowedDomain = process.env.ALLOWED_DOMAIN || 'planbmedia.co.th'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile }) {
      const email = (profile?.email as string) || ''
      if (!isAllowedEmail(email, allowedDomain)) return false
      if (sheetsConfigured()) {
        await provisionUser(email, (profile?.name as string) || '', new Date().toISOString())
      }
      return true
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email as string
        token.name = (profile.name as string) || token.name
        if (sheetsConfigured()) {
          const u = await provisionUser(token.email, token.name as string, new Date().toISOString())
          token.userId = u.id
          token.role = u.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error — เพิ่มฟิลด์ custom ลง session
        session.user.id = token.userId
        // @ts-expect-error custom session role from JWT callback
        session.user.role = token.role
      }
      return session
    },
  },
})
