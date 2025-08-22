import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export function createSupabaseServerClient() {
  // Pass the cookies function reference so the helper can await it as needed (Next.js 15 dynamic APIs)
  return createServerComponentClient({ cookies })
}
