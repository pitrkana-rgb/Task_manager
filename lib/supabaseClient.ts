import { createClient } from '@supabase/supabase-js'

let cached: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel → Project → Settings → Environment Variables).'
    )
  }

  cached = createClient(url, anonKey)
  return cached
}

