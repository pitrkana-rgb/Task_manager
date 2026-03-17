'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await supabase.auth.signOut()
      } finally {
        if (!alive) return
        router.replace('/login')
      }
    })()
    return () => {
      alive = false
    }
  }, [router])

  return (
    <div className="min-h-screen grid place-items-center bg-[#F5F6FB] px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
        <div className="text-sm font-semibold text-slate-700">Odhlášení…</div>
      </div>
    </div>
  )
}

