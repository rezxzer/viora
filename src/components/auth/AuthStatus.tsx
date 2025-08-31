'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type SessionState = {
  userId: string | null
  avatarUrl: string | null
}

export default function AuthStatus() {
  const router = useRouter()
  const [session, setSession] = useState<SessionState>({ userId: null, avatarUrl: null })

  useEffect(() => {
    const supabase = supabaseBrowserClient()

    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id ?? null
      let url: string | null = null
      if (uid) {
        const { data: p } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', uid)
          .maybeSingle()
        url = (p?.avatar_url as string | null) ?? null
      }
      setSession({ userId: uid, avatarUrl: url })
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_: unknown, currentSession: { user: { id: string } | null } | null) => {
        const uid = currentSession?.user?.id ?? null
        let url: string | null = null
        if (uid) {
          const { data: p } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', uid)
            .maybeSingle()
          url = (p?.avatar_url as string | null) ?? null
        }
        setSession({ userId: uid, avatarUrl: url })
      }
    )

    const handler = async () => {
      if (!session.userId) return
      const { data: p } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', session.userId)
        .maybeSingle()
      setSession((s) => ({ ...s, avatarUrl: (p?.avatar_url as string | null) ?? null }))
    }
    window.addEventListener('viora:avatar-updated', handler)

    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener('viora:avatar-updated', handler)
    }
  }, [])

  if (!session.userId) {
    return (
      <Link href="/sign-in" className="text-sm">
        Sign In
      </Link>
    )
  }

  const handleSignOut = async () => {
    const supabase = supabaseBrowserClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Failed to sign out')
      return
    }
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="flex items-center gap-2">
        <UserAvatar src={session.avatarUrl} alt="avatar" fallback="U" />
      </Link>
      <Button size="sm" variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
