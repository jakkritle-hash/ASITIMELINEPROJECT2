import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAllowedEmail } from './policy'

const allowedDomain = process.env.ALLOWED_DOMAIN || 'planbmedia.co.th'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: { params: { hd: allowedDomain, prompt: 'select_account' } },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ profile }) {
      const email = (profile?.email as string) || ''
      return isAllowedEmail(email, allowedDomain)
    },
    async session({ session }) {
      return session
    },
  },
})
