'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'

export default function StatsPage() {
  return (
    <ProtectedRoute>
      <AppShell title="Stats">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">Overview</div>
            <div className="mt-2 text-lg font-semibold">Coming soon</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">Insights</div>
            <div className="mt-2 text-lg font-semibold">Coming soon</div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

