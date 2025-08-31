import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function getAnonSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )
}

export async function getServerUser() {
  const supabase = await getAnonSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) throw new Error('Unauthorized')
  return data.user
}

export function getServiceSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => '',
        set: () => {},
        remove: () => {},
      },
    }
  )
}
