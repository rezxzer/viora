'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'

type Post = {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  created_at: string
  is_featured: boolean
  pinned_at: string | null
}

type UseInfinitePostsProps = {
  userId: string
  limit?: number
}

type UseInfinitePostsReturn = {
  posts: Post[]
  loading: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  error: string | null
}

export default function useInfinitePosts({
  userId,
  limit = 20,
}: UseInfinitePostsProps): UseInfinitePostsReturn {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCursor, setLastCursor] = useState<{
    created_at: string
    id: string
  } | null>(null)

  const fetchPosts = useCallback(
    async (isLoadMore = false) => {
      if (loading) return

      setLoading(true)
      setError(null)
      const supabase = supabaseBrowserClient()

      try {
        const { data, error: fetchError } = await supabase.rpc('get_profile_posts_cursor', {
          p_user_id: userId,
          p_limit: limit,
          p_after_created_at: isLoadMore ? lastCursor?.created_at : null,
          p_after_id: isLoadMore ? lastCursor?.id : null,
        })

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        if (!data || data.length === 0) {
          setHasMore(false)
          return
        }

        if (isLoadMore) {
          setPosts((prev) => [...prev, ...data])
        } else {
          setPosts(data)
        }

        // Update cursor for next page
        const lastPost = data[data.length - 1]
        if (lastPost) {
          setLastCursor({
            created_at: lastPost.created_at,
            id: lastPost.id,
          })
        }

        // Check if we have more posts
        setHasMore(data.length === limit)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts')
      } finally {
        setLoading(false)
      }
    },
    [userId, limit, loading, lastCursor]
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchPosts(true)
  }, [hasMore, loading, fetchPosts])

  const refresh = useCallback(async () => {
    setLastCursor(null)
    setHasMore(true)
    await fetchPosts(false)
  }, [fetchPosts])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refresh,
    error,
  }
}
