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

  const baseBadgeClasses = `${sizeClasses[size]} flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white shadow-lg transition-all duration-200`

  const clickableClasses = `${baseBadgeClasses} hover:bg-white/20 hover:scale-105 hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black/20 active:scale-95`
  const staticClasses = `${baseBadgeClasses} cursor-default`

  return (
    <div className="flex flex-wrap gap-2">
      {/* Followers */}
      {onClick?.followers ? (
        <button
          onClick={onClick.followers}
          className={clickableClasses}
          aria-label={`Open followers - ${stats.followers} followers`}
          title="Open followers"
        >
          <Users className={iconSizes[size]} />
          <span className="font-medium">{stats.followers}</span>
          <span className="text-white/80">Followers</span>
        </button>
      ) : (
        <div className={staticClasses} aria-label={`${stats.followers} followers`}>
          <Users className={iconSizes[size]} />
          <span className="font-medium">{stats.followers}</span>
          <span className="text-white/80">Followers</span>
        </div>
      )}

      {/* Following */}
      {onClick?.following ? (
        <button
          onClick={onClick.following}
          className={clickableClasses}
          aria-label={`Open following - ${stats.following} following`}
          title="Open following"
        >
          <UserPlus className={iconSizes[size]} />
          <span className="font-medium">{stats.following}</span>
          <span className="text-white/80">Following</span>
        </button>
      ) : (
        <div className={staticClasses} aria-label={`${stats.following} following`}>
          <UserPlus className={iconSizes[size]} />
          <span className="font-medium">{stats.following}</span>
          <span className="text-white/80">Following</span>
        </div>
      )}

      {/* Posts */}
      <div className={staticClasses} aria-label={`${stats.posts} posts`}>
        <FileText className={iconSizes[size]} />
        <span className="font-medium">{stats.posts}</span>
        <span className="text-white/80">Posts</span>
      </div>

      {/* Likes */}
      <div className={staticClasses} aria-label={`${stats.likes} likes received`}>
        <Heart className={iconSizes[size]} />
        <span className="font-medium">{stats.likes}</span>
        <span className="text-white/80">Likes</span>
      </div>
    </div>
  )
}
