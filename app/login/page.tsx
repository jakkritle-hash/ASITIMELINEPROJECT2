import { signIn } from '@/lib/auth/config'

/** ปุ่ม Google อย่างเป็นทางการ: โลโก้ G 4 สี */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* blob ไล่เฉดลอยช้าๆ (uiverse-style ambient) — อยู่หลังการ์ด */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-indigo-300/35 blur-3xl" />
        <div className="animate-blob animation-delay-4s absolute -right-16 top-12 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="animate-blob animation-delay-8s absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      {/* การ์ดกระจก + แถบ accent ไล่เฉดด้านบน */}
      <div className="animate-rise relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/80 shadow-[0_2px_4px_rgba(15,23,42,0.05),0_24px_48px_-16px_rgba(79,70,229,0.25)] ring-1 ring-slate-900/[0.06] backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400" />
        <div className="p-8">
          {/* โลโก้แบรนด์เดียวกับ NavBar */}
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-inset ring-white/25">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </span>
            <div className="leading-tight">
              <h1 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">ASI</span>
                <span className="text-slate-800"> Project Tracker</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400">Plan B Media · OOH Ops Console</p>
            </div>
          </div>

          <p className="mb-6 text-sm text-slate-500">
            เข้าสู่ระบบด้วยอีเมลบริษัทเพื่อติดตามโปรเจกต์ งาน และผลงานของทีม
          </p>

          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              className="btn-shine btn-press flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300 hover:shadow-md hover:shadow-indigo-500/10"
            >
              <GoogleLogo />
              Sign in with Google
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 ring-1 ring-slate-200">
              🔒 เฉพาะอีเมล @planbmedia.co.th
            </span>
          </p>
        </div>
      </div>
    </main>
  )
}
