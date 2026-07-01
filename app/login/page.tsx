import { signIn } from '@/lib/auth/config'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Project Tracker</h1>
        <p className="mb-6 text-sm text-gray-500">
          เข้าสู่ระบบด้วยอีเมลบริษัท (@planbmedia.co.th)
        </p>
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  )
}
