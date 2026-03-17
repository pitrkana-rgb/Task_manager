'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

export default function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()

  async function onLogout() {
    router.push('/logout')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 text-[11px] font-extrabold text-white shadow-sm">
              FT
            </div>
            <div>
              <div className="text-sm font-extrabold leading-tight tracking-tight text-slate-900">{title}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <a className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/dashboard">
              Přehled dne
            </a>
            <a className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/tasks">
              Úkoly
            </a>
            <a className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/stats">
              Vyhodnocení
            </a>
            <a className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/profile">
              Profil
            </a>
            <button
              onClick={onLogout}
              className="ml-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Odhlásit
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}

