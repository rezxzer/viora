'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react'

type Post = {
  id: string
  content: string | null
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
}

type PostGridProps = {
  posts: Post[]
}

const PostGrid = memo(function PostGrid({ posts }: PostGridProps) {
  // Filter posts that have media content
  const postsWithMedia = posts.filter((post) => post.image_url)

  if (postsWithMedia.length === 0) {
    return (
      <div className="mb-8 rounded-2xl border bg-surface p-6 text-center text-sm text-muted-foreground">
        No media posts yet.
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {postsWithMedia.map((post) => (
          <Card key={post.id} className="group overflow-hidden">
            <div className="relative aspect-square">
              {post.image_url && (
                <Image
                  src={post.image_url}
                  alt={post.content || 'Post media'}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Overlay content */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{post.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content preview */}
            {post.content && (
              <div className="p-3">
                <p className="line-clamp-2 text-xs text-muted-foreground">{post.content}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
})

export default PostGrid
