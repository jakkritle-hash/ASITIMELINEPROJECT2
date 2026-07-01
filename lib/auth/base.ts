import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'

const allowedDomain = process.env.ALLOWED_DOMAIN || 'planbmedia.co.th'
const authConfigured = !!process.env.AUTH_GOOGLE_ID

/**
 * config ส่วนที่ edge-safe (ไม่ import Node/googleapis) — ใช้ใน middleware
 * ส่วน callbacks ที่แตะ Google Sheet (signIn/jwt/session) อยู่ใน config.ts
 */
export const authConfig = {
  providers: [
    Google({
      authorization: { params: { hd: allowedDomain, prompt: 'select_account' } },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth }) {
      if (!authConfigured) return true // dev ที่ยังไม่ตั้ง OAuth → ไม่ gate
      return !!auth
    },
  },
} satisfies NextAuthConfig
