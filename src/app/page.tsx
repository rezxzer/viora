export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to VIORA</CardTitle>
          <CardDescription>
            Global social network. Create your profile and join the conversation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="flex flex-wrap gap-3">
              <Link href="/feed">
                <Button>Go to Feed</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Go to Profile</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-in">
                <Button>Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
