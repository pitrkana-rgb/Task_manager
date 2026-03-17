'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()

  const name =
    (user?.user_metadata as any)?.name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.username ||
    '—'

  async function onLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <AppShell title="Profile">
        <div className="max-w-xl">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-sm font-semibold text-slate-900">Profile</div>
                <div className="mt-1 text-sm text-slate-600">Your account details.</div>
              </div>
              <button
                onClick={onLogout}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Logout
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Name</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{name}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">Email</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{user?.email ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

