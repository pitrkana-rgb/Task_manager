'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getUser()
      if (!alive) return
      if (data.user) router.push('/dashboard')
    })()
    return () => {
      alive = false
    }
  }, [router])

  const isRegister = mode === 'register'

  const title = useMemo(() => (isRegister ? 'Vytvořit účet' : 'Přihlásit se'), [isRegister])
  const subtitle = useMemo(
    () =>
      isRegister
        ? 'Vytvořte si účet a začněte plánovat svůj den.'
        : 'Přihlaste se a pokračujte tam, kde jste skončili.',
    [isRegister]
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = getSupabase()
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone
            }
          }
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? (isRegister ? 'Registration failed' : 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6FB]">
      <div className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-b from-indigo-500 to-violet-600 text-[11px] font-extrabold text-white shadow-sm">
              FT
            </div>
            <div>
              <div className="text-[15px] font-extrabold tracking-tight text-slate-900">FlowTask</div>
              <div className="text-xs text-slate-500">Správce úkolů</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex rounded-2xl bg-slate-100/80 p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                }}
                className={[
                  'flex-1 rounded-xl px-3 py-2 text-sm font-extrabold transition',
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                ].join(' ')}
              >
                Přihlášení
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError(null)
                }}
                className={[
                  'flex-1 rounded-xl px-3 py-2 text-sm font-extrabold transition',
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                ].join(' ')}
              >
                Registrace
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {isRegister ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Jméno</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Vaše jméno"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Telefon (volitelně)</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      placeholder="+420 777 123 456"
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="např. petr@email.cz"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Heslo</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-[.98] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? isRegister
                    ? 'Vytvářím…'
                    : 'Přihlašuji…'
                  : isRegister
                    ? 'Vytvořit účet'
                    : 'Přihlásit se'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

