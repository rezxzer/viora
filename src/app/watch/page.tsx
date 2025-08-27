export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Suspense } from 'react'
import WatchClient from '@/app/watch/watch-client'

export default async function WatchPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // fetch a slice of latest public posts that have video assets or image/video media
  const { data: stats } = await supabase
    .from('v_post_stats_public')
    .select('post_id, author_id, created_at, likes_count, comments_count')
    .order('created_at', { ascending: false })
    .limit(30)

  const ids = (stats ?? []).map((s) => s.post_id)
  type PostRow = {
    id: string
    author_id: string
    content: string | null
    image_url: string | null
    created_at: string
  }
  type AssetRow = { post_id: string; url: string; mime_type: string }
  const [{ data: posts }, { data: assets }] = await Promise.all([
    ids.length
      ? supabase.from('posts').select('id, author_id, content, image_url, created_at').in('id', ids)
      : Promise.resolve({ data: [] as PostRow[] }),
    ids.length
      ? supabase.from('post_assets').select('post_id, url, mime_type').in('post_id', ids)
      : Promise.resolve({ data: [] as AssetRow[] }),
  ])

  const assetsMap = new Map<string, Array<{ url: string; mime_type: string }>>()
  ;((assets ?? []) as AssetRow[]).forEach((a) => {
    const arr = assetsMap.get(a.post_id) ?? []
    arr.push({ url: a.url, mime_type: a.mime_type })
    assetsMap.set(a.post_id, arr)
  })

  const list = (stats ?? []).map((s) => {
    const p = (posts ?? []).find((x) => x.id === s.post_id) || null
    return {
      id: s.post_id,
      author_id: s.author_id,
      created_at: s.created_at,
      content: p?.content ?? null,
      image_url: p?.image_url ?? null,
      likes_count: s.likes_count ?? 0,
      comments_count: s.comments_count ?? 0,
      assets: assetsMap.get(s.post_id) ?? [],
    }
  })

  return (
    <Suspense>
      <WatchClient initialItems={list} initialViewerId={session?.user.id ?? null} />
    </Suspense>
  )
}
