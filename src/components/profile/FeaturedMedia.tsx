'use client'

import Image from 'next/image'
import { useState } from 'react'

type Post = {
  id: string
  content: string | null
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
}

type FeaturedMediaProps = {
  posts: Post[]
  maxItems?: number
  layout?: 'grid' | 'carousel'
  className?: string
  onOpenUploadMedia?: () => void
}

export default function FeaturedMedia({
  posts,
  maxItems = 4,
  layout = 'grid',
  className = '',
  onOpenUploadMedia,
}: FeaturedMediaProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Filter posts that have media content
  const postsWithMedia = posts.filter((post) => post.image_url).slice(0, maxItems)

  if (postsWithMedia.length === 0) {
    return (
      <div className={`mb-6 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Featured Media</h3>
        <div className="rounded-lg border bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4" aria-live="polite">
            Upload media and pin to feature on your profile.
          </p>
          {onOpenUploadMedia && (
            <button
              onClick={onOpenUploadMedia}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upload media
            </button>
          )}
        </div>
      </div>
    )
  }

  const gridCols =
    postsWithMedia.length <= 2
      ? 'grid-cols-2'
      : postsWithMedia.length <= 3
        ? 'grid-cols-3'
        : 'grid-cols-4'

  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Featured Media</h3>
      <div className={`grid ${gridCols} gap-2`}>
        {postsWithMedia.map((post, index) => (
          <div
            key={post.id}
            className="relative aspect-square overflow-hidden rounded-lg border bg-surface"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {post.image_url && (
              <Image
                src={post.image_url}
                alt={post.content || 'Post media'}
                fill
                className={`object-cover transition-transform duration-200 ${
                  hoveredIndex === index ? 'scale-105' : 'scale-100'
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
