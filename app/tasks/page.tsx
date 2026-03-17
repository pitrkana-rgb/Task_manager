'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <AppShell title="Tasks">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold">Tasks</div>
          <div className="mt-1 text-sm text-slate-600">This route is protected.</div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

