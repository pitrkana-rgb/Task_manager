'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const email = user?.email ?? ''
  const name =
    (user?.user_metadata as any)?.name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.username ||
    ''

  const src = `/flowtask?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`

  return (
    <ProtectedRoute>
      <div className="h-screen">
        <iframe title="FlowTask" src={src} className="h-full w-full border-0" />
      </div>
    </ProtectedRoute>
  )
}

