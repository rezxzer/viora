'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClientComponentClient({ supabaseUrl: url, supabaseKey: anonKey })
}
