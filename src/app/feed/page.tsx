export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import Composer from '../../components/post/Composer'
import PostCard from '../../components/post/PostCard'
import PostCardSkeleton from '../../components/post/PostCardSkeleton'

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ after?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null

  // Cursor-based pagination via `?after=ISO` on created_at
  const q = searchParams ? await searchParams : undefined
  const after = q?.after ?? null

  // Fetch latest posts from public profiles only
  let query = supabase
    .from('v_post_stats_public')
    .select('post_id, author_id, created_at, likes_count, comments_count')
    .order('created_at', { ascending: false })
    .limit(20)
  if (after) {
    query = query.lt('created_at', after)
  }
  const { data: statRows } = await query

  // now fetch full post content for those ids to show text/image
  const statsList = (statRows ?? []) as Array<{
    post_id: string
    author_id: string
    created_at: string
    likes_count: number
    comments_count: number
  }>
  const postIdsForContent = statsList.map((s) => s.post_id)
  type PostRow = {
    id: string
    author_id: string
    content: string | null
    image_url: string | null
    created_at: string
  }
  const { data: posts } = postIdsForContent.length
    ? await supabase
        .from('posts')
        .select('id, author_id, content, image_url, created_at')
        .in('id', postIdsForContent)
    : { data: [] as PostRow[] }

  // Merge stats back onto posts preserving order from statsList
  const postsMap = new Map<string, PostRow>()
  ;((posts ?? []) as PostRow[]).forEach((p) => postsMap.set(p.id, p))
  const postList = statsList
    .map((s) => {
      const base = postsMap.get(s.post_id)
      return {
        id: s.post_id,
        author_id: base?.author_id ?? s.author_id,
        created_at: s.created_at,
        content: base?.content ?? null,
        image_url: base?.image_url ?? null,
        likes_count: s.likes_count,
        comments_count: s.comments_count,
      }
    })
    .filter((p) => p && p.id)
  const postIds = postList.map((p) => p.id)
  const authorIds = Array.from(new Set(postList.map((p) => p.author_id)))

  const [
    { data: stats },
    { data: liked },
    { data: authors },
    viewerProfileResult,
    { data: assets },
  ] = await Promise.all([
    Promise.resolve({
      data: postList.map((p) => ({
        post_id: p.id,
        likes_count: p.likes_count ?? 0,
        comments_count: p.comments_count ?? 0,
      })),
      error: null as null,
    }),
    userId && postIds.length
      ? supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [] as Array<{ post_id: string }>, error: null as null }),
    authorIds.length
      ? supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', authorIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string
            username: string | null
            full_name: string | null
            avatar_url: string | null
          }>,
          error: null as null,
        }),
    userId
      ? supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as {
          data: {
            id: string
            username: string | null
            full_name: string | null
            avatar_url: string | null
          } | null
          error: null
        }),
    postIds.length
      ? supabase.from('post_assets').select('post_id, url, mime_type').in('post_id', postIds)
      : Promise.resolve({
          data: [] as Array<{ post_id: string; url: string; mime_type: string }>,
          error: null as null,
        }),
  ])

  const postIdToStats = new Map<string, { likes_count: number; comments_count: number }>()
  const statsRows = (stats ?? []) as Array<{
    post_id: string
    likes_count: number
    comments_count: number
  }>
  statsRows.forEach((s) =>
    postIdToStats.set(s.post_id, { likes_count: s.likes_count, comments_count: s.comments_count })
  )

  const likedRows = (liked ?? []) as Array<{ post_id: string }>
  const likedSet = new Set<string>(likedRows.map((r) => r.post_id))
  const authorMap = new Map<
    string,
    { username: string | null; full_name: string | null; avatar_url: string | null }
  >()
  const authorRows = (authors ?? []) as Array<{
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }>
  authorRows.forEach((a) =>
    authorMap.set(a.id, { username: a.username, full_name: a.full_name, avatar_url: a.avatar_url })
  )

  type AssetRow = { post_id: string; url: string; mime_type: string }
  const assetsMap = new Map<string, Array<{ url: string; mime_type: string }>>()
  ;((assets ?? []) as AssetRow[]).forEach((a) => {
    const arr = assetsMap.get(a.post_id) ?? []
    arr.push({ url: a.url, mime_type: a.mime_type })
    assetsMap.set(a.post_id, arr)
  })

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-4">
      {userId ? (
        <Composer
          userId={userId}
          avatarUrl={
            (viewerProfileResult as { data: { avatar_url: string | null } | null } | null)?.data
              ?.avatar_url ??
            authorMap.get(userId)?.avatar_url ??
            null
          }
        />
      ) : null}

      <div className="space-y-4">
        {postList.length === 0 ? (
          <PostCardSkeleton withImage />
        ) : (
          postList.map((p) => (
            <PostCard
              key={p.id}
              postId={p.id}
              authorId={p.author_id}
              authorUsername={authorMap.get(p.author_id)?.username ?? null}
              authorFullName={authorMap.get(p.author_id)?.full_name ?? null}
              authorAvatarUrl={authorMap.get(p.author_id)?.avatar_url ?? null}
              createdAt={p.created_at}
              content={p.content}
              imageUrl={p.image_url}
              initialLikesCount={postIdToStats.get(p.id)?.likes_count ?? 0}
              initialCommentsCount={postIdToStats.get(p.id)?.comments_count ?? 0}
              initiallyLiked={likedSet.has(p.id)}
              viewerId={userId}
              assets={assetsMap.get(p.id) ?? []}
            />
          ))
        )}
        {postList.length > 0 ? (
          <div className="pt-2 text-center">
            <Link
              href={`/feed?after=${encodeURIComponent(postList[postList.length - 1]!.created_at)}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              Load more
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
