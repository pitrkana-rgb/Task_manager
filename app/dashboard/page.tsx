'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell title="Dashboard">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">Status</div>
            <div className="mt-2 text-lg font-semibold">Authenticated</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">Protected</div>
            <div className="mt-2 text-lg font-semibold">Route Guard</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">Session</div>
            <div className="mt-2 text-lg font-semibold">Persisted</div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

