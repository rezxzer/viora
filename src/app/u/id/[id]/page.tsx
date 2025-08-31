export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProfileTabs from '@/app/profile/ProfileTabs'

type Params = { params: Promise<{ id: string }> }

type PublicProfile = {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
}

type ProfileStats = {
  followers_count: number
  following_count: number
  posts_count: number
  likes_received: number
  last_post_at: string | null
}

export default async function PublicProfileByIdPage({ params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params

  // Load profile by id directly from table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, bio, avatar_url')
    .eq('id', id)
    .maybeSingle<PublicProfile>()

  if (!profile) {
    notFound()
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const viewerId = session?.user.id ?? null

  // Stats for target user via RPC
  const { data: statsRow } = await supabase
    .rpc('get_profile_stats', { target: profile.id })
    .maybeSingle()
  const stats = (statsRow ?? null) as ProfileStats | null

  // Whether current viewer follows this profile
  let isFollowing = false
  if (viewerId) {
    const { data: rel } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', viewerId)
      .eq('followee_id', profile.id)
      .maybeSingle()
    isFollowing = !!rel
  }

  const { data: posts } = await supabase
    .from('v_post_stats_public')
    .select('post_id, author_id, likes_count, comments_count, created_at')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  let likedIds: string[] = []
  if (viewerId && posts && posts.length > 0) {
    const { data: likedRows } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', viewerId)
      .in(
        'post_id',
        posts.map((p) => p.post_id)
      )
    likedIds = ((likedRows ?? []) as { post_id: string }[]).map((r) => r.post_id)
  }

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        {/* Public view keeps avatar read-only */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar_url ?? undefined}
          alt={profile.username ?? 'avatar'}
          className="h-40 w-40 rounded-2xl object-cover bg-accent"
        />
      </aside>
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold mb-4">
          {profile.full_name || 'Unnamed'} {profile.username ? `(@${profile.username})` : ''}
        </h1>
        <ProfileTabs
          userId={viewerId ?? ''}
          profile={{
            id: profile.id,
            full_name: profile.full_name ?? null,
            username: profile.username ?? null,
            bio: profile.bio ?? null,
            avatar_url: profile.avatar_url ?? null,
            location: null,
            website: null,
            birthday: null,
            links: null,
            pronouns: null,
            privacy_level: null,
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
          showFollowButton={!!viewerId && viewerId !== profile.id}
          targetUserId={profile.id}
          initialIsFollowing={isFollowing}
          initialPosts={posts ?? []}
          initialLikedPostIds={likedIds}
          readOnly={true}
          postsAuthorId={profile.id}
          viewerId={viewerId}
        />
      </div>
    </div>
  )
}
