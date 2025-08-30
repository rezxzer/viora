export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AvatarUploader from '@/components/profile/AvatarUploader'
import ProfileTabs from './ProfileTabs'
import { Button } from '@/components/ui/button'
import { Radio } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const [{ data: sessionData }, { data: profileData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from('profiles')
      .select(
        'id, full_name, username, bio, avatar_url, location, website, birthday, links, pronouns, privacy_level'
      )
      .maybeSingle(),
  ])

  const session = sessionData.session
  if (!session) {
    redirect('/sign-in?message=Please sign in to continue.')
  }

  const currentUserId = session.user.id
  let profile = profileData
  if (!profile || profile.id !== currentUserId) {
    const { data } = await supabase
      .from('profiles')
      .select(
        'id, full_name, username, bio, avatar_url, location, website, birthday, links, pronouns, privacy_level'
      )
      .eq('id', currentUserId)
      .single()
    profile = data ?? null
  }

  // Fetch profile stats via RPC
  type ProfileStats = {
    followers_count: number
    following_count: number
    posts_count: number
    likes_received: number
    last_post_at: string | null
  }
  const { data: statsRow } = await supabase
    .rpc('get_profile_stats', { target: currentUserId })
    .maybeSingle()
  const stats = (statsRow ?? null) as ProfileStats | null

  // Fetch recent posts and their stats
  const { data: postsData } = await supabase
    .from('v_post_stats')
    .select('post_id, author_id, likes_count, comments_count, created_at')
    .eq('author_id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  let likedIds: string[] = []
  if (postsData && postsData.length > 0) {
    const { data: likedRows } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in(
        'post_id',
        postsData.map((p) => p.post_id)
      )
    likedIds = ((likedRows ?? []) as { post_id: string }[]).map((r) => r.post_id)
  }

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Avatar</h2>
        <AvatarUploader userId={currentUserId} initialUrl={profile?.avatar_url ?? null} />
      </aside>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">My Profile</h1>
          <Button asChild variant="outline" size="sm">
            <a href="/creator/streams" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Creator Dashboard
            </a>
          </Button>
        </div>
        <ProfileTabs
          userId={currentUserId}
          profile={{
            id: currentUserId,
            full_name: profile?.full_name ?? null,
            username: profile?.username ?? null,
            bio: profile?.bio ?? null,
            avatar_url: profile?.avatar_url ?? null,
            location: profile?.location ?? null,
            website: profile?.website ?? null,
            birthday: profile?.birthday ?? null,
            links: (profile?.links as Record<string, string> | null) ?? null,
            pronouns: profile?.pronouns ?? null,
            privacy_level: (() => {
              const v = (profile?.privacy_level as unknown as string | null) ?? null
              return v === 'public' || v === 'followers_only' || v === 'verified_only' ? v : null
            })(),
          }}
          initialStats={
            stats
              ? {
                  followers_count: stats.followers_count ?? 0,
                  following_count: stats.following_count ?? 0,
                  posts_count: stats.posts_count ?? 0,
                  likes_received: stats.likes_received ?? 0,
                }
              : null
          }
          showFollowButton={false}
          initialPosts={postsData ?? []}
          initialLikedPostIds={likedIds}
          viewerId={currentUserId}
        />
      </div>
    </div>
  )
}
