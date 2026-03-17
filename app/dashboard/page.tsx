'use client'

import { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const email = user?.email ?? ''
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!uid) return
      try {
        const supabase = getSupabase()
        const { data } = (await supabase
          .from('profiles')
          .select('name')
          .eq('id', uid)
          .maybeSingle()) as { data: { name: string } | null }
        if (!alive) return
        setProfileName((data?.name ?? '').trim())
      } catch {
        // ignore: we still can fall back to metadata name
      }
    })()
    return () => {
      alive = false
    }
  }, [uid])

  const name = useMemo(() => {
    const metaName =
      ((user?.user_metadata as any)?.name ||
        (user?.user_metadata as any)?.full_name ||
        (user?.user_metadata as any)?.username ||
        '') as string
    return (profileName || metaName || '').trim()
  }, [profileName, user?.user_metadata])

  const src = `/flowtask?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`

  return (
    <ProtectedRoute>
      <div className="h-screen">
        <iframe title="FlowTask" src={src} className="h-full w-full border-0" />
      </div>
    </ProtectedRoute>
  )
}

