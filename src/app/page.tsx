export const dynamic = 'force-dynamic'
export const revalidate = 60

import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PostCardLite from '../components/post/PostCardLite'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Trending posts: by likes desc then created_at desc (public authors only)
  const { data: statRows } = await supabase
    .from('v_post_stats_public')
    .select('post_id, author_id, created_at, likes_count, comments_count')
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12)

  const statList = (statRows ?? []) as Array<{
    post_id: string
    author_id: string
    created_at: string
    likes_count: number
    comments_count: number
  }>

  const postIds = statList.map((s) => s.post_id)
  const authorIds = Array.from(new Set(statList.map((s) => s.author_id)))

  type PostRow = {
    id: string
    author_id: string
    content: string | null
    image_url: string | null
    created_at: string
  }
  type LikeRow = { post_id: string }
  type AuthorRow = {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
  const [{ data: posts }, { data: liked }, { data: authors }] = await Promise.all([
    postIds.length
      ? supabase
          .from('posts')
          .select('id, author_id, content, image_url, created_at')
          .in('id', postIds)
      : Promise.resolve({ data: [] as PostRow[] }),
    session && postIds.length
      ? supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', session.user.id)
          .in('post_id', postIds)
      : Promise.resolve({ data: [] as LikeRow[] }),
    authorIds.length
      ? supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', authorIds)
      : Promise.resolve({ data: [] as AuthorRow[] }),
  ])

  const likedSet = new Set<string>(((liked ?? []) as LikeRow[]).map((r) => r.post_id))
  const postsMap = new Map<string, PostRow>()
  ;((posts ?? []) as PostRow[]).forEach((p) => postsMap.set(p.id, p))
  const authorMap = new Map<
    string,
    { username: string | null; full_name: string | null; avatar_url: string | null }
  >()
  ;((authors ?? []) as AuthorRow[]).forEach((a) =>
    authorMap.set(a.id, { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url })
  )

  // Top creators: by followers count desc (public only)
  const { data: topCreatorsRows } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .order('id', { ascending: true })
    .limit(0)

  // Compute via RPC for accuracy (fallback-friendly if not available yet)
  const { data: followerCounts } = await supabase.from('follows').select('followee_id')

  const counts = new Map<string, number>()
  ;((followerCounts ?? []) as Array<{ followee_id: string }>).forEach((r) =>
    counts.set(r.followee_id, (counts.get(r.followee_id) ?? 0) + 1)
  )
  const ranking = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const topIds = ranking.map(([id]) => id)
  const { data: creators } = topIds.length
    ? await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', topIds)
    : { data: [] as AuthorRow[] }

  const creatorsMap = new Map<
    string,
    { username: string | null; full_name: string | null; avatar_url: string | null }
  >()
  ;((creators ?? []) as AuthorRow[]).forEach((c) =>
    creatorsMap.set(c.id, {
      username: c.username,
      full_name: c.full_name,
      avatar_url: c.avatar_url,
    })
  )

  return (
    <main>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/0">
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

        {/* Top Creators */}
        <div className="space-y-3">
          <div className="text-lg font-semibold">Top creators</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ranking.length === 0 ? (
              <div className="rounded-2xl border bg-surface p-6 text-sm text-muted-foreground">
                No creators yet.
              </div>
            ) : (
              ranking.map(([id, cnt]) => {
                const c = creatorsMap.get(id)
                if (!c) return null
                return (
                  <Card key={id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatar_url ?? '/avatar-placeholder.svg'}
                        alt={c.username ?? 'avatar'}
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {c.full_name || c.username || 'User'}
                        </div>
                        <div className="text-xs text-muted-foreground">@{c.username || 'user'}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{cnt} followers</div>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Trending Posts */}
        <div className="space-y-3">
          <div className="text-lg font-semibold">Trending posts</div>
          <div className="space-y-4">
            {statList.length === 0 ? (
              <div className="rounded-2xl border bg-surface p-6 text-sm text-muted-foreground">
                Nothing yet. Check back soon.
              </div>
            ) : (
              statList.map((s) => {
                const p = postsMap.get(s.post_id) || {
                  id: s.post_id,
                  author_id: s.author_id,
                  created_at: s.created_at,
                  content: null,
                  image_url: null,
                }
                return (
                  <PostCardLite
                    key={s.post_id}
                    postId={s.post_id}
                    authorId={p.author_id}
                    createdAt={p.created_at}
                    initialLikesCount={s.likes_count}
                    initialCommentsCount={s.comments_count}
                    initiallyLiked={likedSet.has(s.post_id)}
                    content={p.content}
                    imageUrl={p.image_url}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
