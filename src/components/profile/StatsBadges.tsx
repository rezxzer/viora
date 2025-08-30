'use client'

import { Users, Heart, FileText, UserPlus } from 'lucide-react'

type StatsBadgesProps = {
  stats: {
    followers: number
    following: number
    posts: number
    likes: number
  }
  size?: 'sm' | 'md'
  onClick?: {
    followers?: () => void
    following?: () => void
  }
}

export default function StatsBadges({ stats, size = 'md', onClick }: StatsBadgesProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  }

  const badgeClasses = `${sizeClasses[size]} flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white shadow-lg transition-all duration-200 hover:bg-white/20 hover:scale-105`

  return (
    <div className="flex flex-wrap gap-2">
      {/* Followers */}
      <button
        onClick={onClick?.followers}
        className={`${badgeClasses} ${onClick?.followers ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label={`${stats.followers} followers`}
      >
        <Users className={iconSizes[size]} />
        <span className="font-medium">{stats.followers}</span>
        <span className="text-white/80">Followers</span>
      </button>

      {/* Following */}
      <button
        onClick={onClick?.following}
        className={`${badgeClasses} ${onClick?.following ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label={`${stats.following} following`}
      >
        <UserPlus className={iconSizes[size]} />
        <span className="font-medium">{stats.following}</span>
        <span className="text-white/80">Following</span>
      </button>

      {/* Posts */}
      <div className={badgeClasses} aria-label={`${stats.posts} posts`}>
        <FileText className={iconSizes[size]} />
        <span className="font-medium">{stats.posts}</span>
        <span className="text-white/80">Posts</span>
      </div>

      {/* Likes */}
      <div className={badgeClasses} aria-label={`${stats.likes} likes received`}>
        <Heart className={iconSizes[size]} />
        <span className="font-medium">{stats.likes}</span>
        <span className="text-white/80">Likes</span>
      </div>
    </div>
  )
}
