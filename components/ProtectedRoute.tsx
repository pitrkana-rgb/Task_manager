'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function Spinner() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
        Loading...
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading) return <Spinner />
  if (!user) return <Spinner />

  return <>{children}</>
}

