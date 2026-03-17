'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <AppShell title="Úkoly">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-extrabold tracking-tight text-slate-900">Úkoly</div>
          <div className="mt-1 text-sm text-slate-600">—</div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

