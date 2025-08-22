import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

/**
 * Deletes the current authenticated user using the Service Role key.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to be set on the server.
 */
export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) {
    return new NextResponse('Server is not configured with a service role key.', { status: 503 })
  }

  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { error: delError } = await admin.auth.admin.deleteUser(user.id)
  if (delError) {
    return new NextResponse(delError.message, { status: 500 })
  }

  return new NextResponse('OK', { status: 200 })
}
