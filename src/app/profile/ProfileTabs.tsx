'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
// Use relative path to avoid occasional TS path alias resolution glitches in editors
import PostCardLite from '../../components/post/PostCardLite'
import Composer from '../../components/post/Composer'
import { useEffect, useState, useTransition } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import AccountForm from './AccountForm'
import ProfileForm from './ProfileForm'
import PrivacyForm from './PrivacyForm'
import type { ProfileData } from './types'
import MonetizationForm from './MonetizationForm'
import PostEditDialog from '../../components/post/PostEditDialog'
import CommentsDialog from '../../components/post/CommentsDialog'
import FollowersDialog from '../../components/profile/FollowersDialog'
// Feature flags and new UI components
import { flags } from '@/lib/flags'
import CoverGradient from '../../components/profile/CoverGradient'
import AvatarRing from '../../components/profile/AvatarRing'
import FeaturedMedia from '../../components/profile/FeaturedMedia'
import GalleryToggle from '../../components/profile/GalleryToggle'
import PostGrid from '../../components/post/PostGrid'
import VerificationBadge from '../../components/profile/VerificationBadge'
import Ripple from '../../components/ui/Ripple'
import StatsBadges from '../../components/profile/StatsBadges'
import ProfileHeaderLayout from '../../components/profile/ProfileHeaderLayout'
import AboutCard from '../../components/profile/AboutCard'
import SocialLinks from '../../components/profile/SocialLinks'
import { ProfileHeaderSkeleton, PostSkeleton } from '../../components/ui/skeleton'
import VerificationRequestForm from '../../components/profile/VerificationRequestForm'
import VerificationStatus from '../../components/profile/VerificationStatus'
import PostActionsExtra from '../../components/post/PostActionsExtra'
import GalleryFilters, { type GalleryFilter } from '../../components/post/GalleryFilters'
import useInfinitePosts from '../../hooks/useInfinitePosts'
import AvatarEditTrigger from '../../components/profile/AvatarEditTrigger'
import AvatarEditDialog from '../../components/profile/AvatarEditDialog'

// ProfileData type is centralized in ./types to avoid circular imports and editor glitches

type Props = {
  userId: string
  profile: ProfileData
  readOnly?: boolean // when viewing someone else: hide owner-only tabs/actions
  // Profile header metrics and actions
  initialStats: {
    followers_count: number
    following_count: number
    posts_count: number
    likes_received: number
  } | null
  showFollowButton?: boolean
  targetUserId?: string // whom the current viewer is looking at
  initialIsFollowing?: boolean
  // Posts for the profile owner
  initialPosts?: Array<{
    post_id: string
    author_id: string
    created_at: string
    likes_count: number
    comments_count: number
  }>
  initialLikedPostIds?: string[]
  postsAuthorId?: string // whose posts to list (defaults to userId if not provided)
  viewerId?: string | null // current user's ID for follow/unfollow actions
}

export default function ProfileTabs({
  userId,
  profile,
  readOnly = false,
  initialStats,
  showFollowButton = false,
  targetUserId,
  initialIsFollowing = false,
  initialPosts = [],
  initialLikedPostIds = [],
  postsAuthorId,
  viewerId = null,
}: Props) {
  const [stats, setStats] = useState(initialStats)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()
  const [myPosts, setMyPosts] = useState(initialPosts)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<{
    id: string
    content: string | null
    imageUrl: string | null
  } | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null)
  const [followersOpen, setFollowersOpen] = useState(false)
  const [followingOpen, setFollowingOpen] = useState(false)
  const [galleryView, setGalleryView] = useState<'list' | 'grid'>('list')
  const [avatarEditOpen, setAvatarEditOpen] = useState(false)

  const canFollow = showFollowButton && !!targetUserId && targetUserId !== userId
  const authorIdForPosts = postsAuthorId || userId

  const onToggleFollow = async () => {
    if (!canFollow || !stats) return
    const supabase = supabaseBrowserClient()

    startTransition(async () => {
      try {
        if (isFollowing) {
          // Optimistic update
          setIsFollowing(false)
          setStats({ ...stats, followers_count: Math.max(0, stats.followers_count - 1) })
          const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', userId)
            .eq('followee_id', targetUserId!)
          if (error) {
            // Revert
            setIsFollowing(true)
            setStats((s) => (s ? { ...s, followers_count: s.followers_count + 1 } : s))
            toast.error(error.message)
          }
        } else {
          setIsFollowing(true)
          setStats({ ...stats, followers_count: stats.followers_count + 1 })
          const { error } = await supabase
            .from('follows')
            .insert({ follower_id: userId, followee_id: targetUserId! })
          if (error) {
            setIsFollowing(false)
            setStats((s) => (s ? { ...s, followers_count: Math.max(0, s.followers_count - 1) } : s))
            toast.error(error.message)
          } else {
            toast.success('Followed')
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update follow state'
        toast.error(message)
      }
    })
  }

  // Ensure we have freshest posts when user opens the tab
  useEffect(() => {
    if (myPosts.length === 0) return
  }, [myPosts.length])

  const reloadPosts = async () => {
    const supabase = supabaseBrowserClient()
    setLoadingPosts(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, author_id, created_at, content, image_url')
        .eq('author_id', authorIdForPosts)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      type Row = {
        id: string
        author_id: string
        created_at: string
        content: string | null
        image_url: string | null
      }
      const rows = (data as Row[]) || []
      // Preserve existing counts where available
      const countsMap = new Map<string, { likes_count: number; comments_count: number }>()
      ;[...myPosts, ...initialPosts].forEach((p) => {
        const key = p.post_id
        countsMap.set(key, {
          likes_count: p.likes_count ?? 0,
          comments_count: p.comments_count ?? 0,
        })
      })
      const mapped = rows.map((r) => {
        const counts = countsMap.get(r.id) || { likes_count: 0, comments_count: 0 }
        return {
          post_id: r.id,
          author_id: r.author_id,
          created_at: r.created_at,
          content: r.content ?? null,
          image_url: r.image_url ?? null,
          likes_count: counts.likes_count,
          comments_count: counts.comments_count,
        }
      })
      setMyPosts(mapped)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load posts'
      toast.error(message)
    } finally {
      setLoadingPosts(false)
    }
  }

  // On first render, refresh posts to include content/image_url
  useEffect(() => {
    void reloadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDeletePost = (postId: string) => {
    startTransition(async () => {
      try {
        const supabase = supabaseBrowserClient()
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)
          .eq('author_id', userId)
        if (error) throw error
        setMyPosts((prev) => prev.filter((p) => p.post_id !== postId))
        toast.success('Post deleted')
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to delete'
        toast.error(message)
      }
    })
  }

  const onEditPost = (postId: string) => {
    const row = myPosts.find((p) => p.post_id === postId) as unknown as
      | { content: string | null; image_url: string | null }
      | undefined
    setEditing({ id: postId, content: row?.content ?? null, imageUrl: row?.image_url ?? null })
    setEditOpen(true)
  }

  const [tab, setTab] = useState<'posts' | 'profile' | 'account' | 'privacy' | 'monetization'>(
    'posts'
  )

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        if (readOnly && v !== 'posts') return
        setTab(v as typeof tab)
      }}
      className="w-full"
    >
      {/* Super header */}
      <div className="mb-6 overflow-hidden rounded-2xl border bg-surface shadow-soft ring-1 ring-white/5 hover:ring-1 hover:ring-white/10 transition-all duration-200 relative">
        {/* Cover */}
        <div className="h-28 w-full bg-gradient-to-r from-primary/25 to-primary/5 relative">
          {flags.coverGradients && <CoverGradient variant="default" className="rounded-t-2xl" />}
        </div>
        {/* Row with avatar + name + actions */}
        <div className="flex items-end justify-between gap-4 px-4 pb-4">
          <div className="-mt-10 flex items-end gap-4">
            {/* Avatar */}
            {flags.avatarRing ? (
              <AvatarRing status="online" size="lg">
                {!readOnly ? (
                  <AvatarEditTrigger onEdit={() => setAvatarEditOpen(true)}>
                    <div
                      className="h-20 w-20 overflow-hidden rounded-full border bg-elev shadow-soft hover:ring-2 hover:ring-primary/30 transition-all duration-200"
                      aria-hidden
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profile.avatar_url || '/avatar-placeholder.svg'}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </AvatarEditTrigger>
                ) : (
                  <div
                    className="h-20 w-20 overflow-hidden rounded-full border bg-elev shadow-soft"
                    aria-hidden
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.avatar_url || '/avatar-placeholder.svg'}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </AvatarRing>
            ) : !readOnly ? (
              <AvatarEditTrigger onEdit={() => setAvatarEditOpen(true)}>
                <div
                  className="h-20 w-20 overflow-hidden rounded-full border bg-elev shadow-soft hover:ring-2 hover:ring-primary/30 transition-all duration-200"
                  aria-hidden
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatar_url || '/avatar-placeholder.svg'}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
              </AvatarEditTrigger>
            ) : (
              <div
                className="h-20 w-20 overflow-hidden rounded-full border bg-elev shadow-soft"
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar_url || '/avatar-placeholder.svg'}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {/* Name + bio */}
            <div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-semibold">{profile.full_name || 'Unnamed'}</div>
                {flags.verificationBadge && <VerificationBadge isVerified={false} size="md" />}
              </div>
              <div className="text-sm text-muted-foreground">@{profile.username || 'username'}</div>
              {profile.bio ? (
                <div className="mt-1 max-w-xl text-sm text-muted-foreground">{profile.bio}</div>
              ) : null}
            </div>
          </div>

          {/* Follow/Unfollow or Edit button */}
          <div className="flex flex-wrap gap-2">
            {canFollow ? (
              <Button
                onClick={onToggleFollow}
                disabled={isPending}
                variant={isFollowing ? 'secondary' : 'default'}
                className="h-10 px-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ring-offset-2 ring-offset-surface hover:ring-1 hover:ring-primary/30 transition-all duration-200"
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            ) : !readOnly ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setTab('profile')}
                  className="h-10 px-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ring-offset-2 ring-offset-surface hover:ring-1 hover:ring-primary/30 transition-all duration-200"
                >
                  Edit profile
                </Button>
                <Button
                  onClick={() => {
                    setTab('posts')
                    // Smooth scroll to the composer area
                    try {
                      const el = document.getElementById('profile-composer')
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    } catch {}
                  }}
                  className="h-10 px-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ring-offset-2 ring-offset-surface hover:ring-1 hover:ring-primary/30 transition-all duration-200"
                >
                  Upload media
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-3 border-t border-white/5 px-4 py-3 mt-3 md:mt-4">
          {stats ? (
            <>
              {flags.statsBadges ? (
                <StatsBadges
                  stats={{
                    followers: stats.followers_count,
                    following: stats.following_count,
                    posts: stats.posts_count,
                    likes: stats.likes_received,
                  }}
                  size="sm"
                  onClick={{
                    followers: () => setFollowersOpen(true),
                    following: () => setFollowingOpen(true),
                  }}
                />
              ) : (
                <>
                  <button
                    onClick={() => setFollowersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border bg-elev px-3 py-1 text-xs hover:bg-elev/80 transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{stats.followers_count}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </button>
                  <button
                    onClick={() => setFollowingOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border bg-elev px-3 py-1 text-xs hover:bg-elev/80 transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{stats.following_count}</span>
                    <span className="text-muted-foreground">Following</span>
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-full border bg-elev px-3 py-1 text-xs">
                    <span className="font-medium">{stats.posts_count}</span>
                    <span className="text-muted-foreground">Posts</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border bg-elev px-3 py-1 text-xs">
                    <span className="font-medium">{stats.likes_received}</span>
                    <span className="text-muted-foreground">Likes received</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <div className="h-6 w-24 skeleton rounded-full" />
              <div className="h-6 w-24 skeleton rounded-full" />
              <div className="h-6 w-24 skeleton rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Sticky tabs */}
      <div
        className={`${flags.stickyProfileTabs ? 'sticky top-16 md:top-20 z-20 bg-elev/80 backdrop-blur supports-[backdrop-filter]:bg-elev/60 border-b border-white/5' : ''} -mx-2 mb-4 px-2`}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          {!readOnly && <TabsTrigger value="profile">Profile</TabsTrigger>}
          {!readOnly && <TabsTrigger value="account">Account</TabsTrigger>}
          {!readOnly && <TabsTrigger value="privacy">Privacy</TabsTrigger>}
          {!readOnly && <TabsTrigger value="monetization">Monetization</TabsTrigger>}

          {/* Duplicate triggers removed; owner-only triggers are rendered below when !readOnly */}
        </TabsList>
      </div>

      {/* Posts tab content */}
      <TabsContent value="posts">
        <CommentsDialog
          postId={commentsPostId || ''}
          open={commentsOpen}
          onOpenChange={(v) => setCommentsOpen(v)}
          viewerId={userId}
          postAuthorId={userId}
        />
        <PostEditDialog
          postId={editing?.id || ''}
          open={editOpen}
          onOpenChange={setEditOpen}
          initialContent={editing?.content ?? null}
          initialImageUrl={editing?.imageUrl ?? null}
          userId={userId}
          onSaved={reloadPosts}
        />
        {!readOnly && (
          <div id="profile-composer">
            <Composer userId={userId} avatarUrl={profile.avatar_url} />
          </div>
        )}

        {/* Gallery Controls */}
        {myPosts.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Gallery Toggle */}
            {flags.galleryToggle && (
              <div className="flex items-center justify-between">
                <GalleryToggle
                  mode={galleryView}
                  onChange={setGalleryView}
                  totalPosts={myPosts.length}
                  mediaPosts={
                    myPosts.filter((p) => (p as { image_url?: string | null }).image_url).length
                  }
                />
              </div>
            )}

            {/* Gallery Filters */}
            {flags.galleryFilters && galleryView === 'grid' && (
              <GalleryFilters
                activeFilter="all"
                onFilterChange={() => {}}
                hasPhotos={myPosts.some((p) => 'image_url' in p && p.image_url)}
                hasVideos={false}
                hasFeatured={false}
                hasPinned={false}
              />
            )}
          </div>
        )}

        {/* About Card */}
        {flags.aboutCard && (
          <AboutCard
            bio={profile.bio || undefined}
            location={profile.location || undefined}
            website={profile.website || undefined}
            interests={[]} // No interests field in current profile payload
            isOwner={!readOnly && viewerId === userId}
            onEditProfile={() => setTab('profile')}
          />
        )}

        {/* Verification Status & Request */}
        {flags.verificationFlow && (
          <div className="mb-6">
            <VerificationStatus userId={userId} isVerified={false} />
            {!false && ( // profile.is_verified not available yet
              <VerificationRequestForm
                userId={userId}
                onSubmitted={() => {
                  // Refresh verification status
                }}
              />
            )}
          </div>
        )}

        {/* Featured Media Grid */}
        {flags.featuredMedia && myPosts.length > 0 && (
          <FeaturedMedia
            posts={myPosts.map((p) => ({
              id: p.post_id,
              content: (p as { content?: string | null }).content ?? null,
              image_url: (p as { image_url?: string | null }).image_url ?? null,
              created_at: p.created_at,
              likes_count: p.likes_count,
              comments_count: p.comments_count,
            }))}
            maxItems={4}
            layout="grid"
          />
        )}
        {myPosts.length > 0 ? (
          <>
            {/* Gallery View */}
            {flags.galleryToggle && galleryView === 'grid' ? (
              <PostGrid
                posts={myPosts.map((p) => ({
                  id: p.post_id,
                  content: (p as { content?: string | null }).content ?? null,
                  image_url: (p as { image_url?: string | null }).image_url ?? null,
                  created_at: p.created_at,
                  likes_count: p.likes_count,
                  comments_count: p.comments_count,
                }))}
              />
            ) : (
              /* List View */
              <div className="space-y-4 mb-8">
                {myPosts.map((p) => (
                  <div key={p.post_id} className="group relative">
                    <PostCardLite
                      postId={p.post_id}
                      authorId={p.author_id}
                      createdAt={p.created_at}
                      content={(p as { content?: string | null }).content}
                      imageUrl={(p as { image_url?: string | null }).image_url}
                      initialLikesCount={p.likes_count}
                      initialCommentsCount={p.comments_count}
                      initiallyLiked={initialLikedPostIds.includes(p.post_id)}
                    />
                    {/* Owner actions */}
                    {userId === p.author_id ? (
                      <div className="absolute right-3 top-3 hidden gap-2 group-hover:flex">
                        {flags.microInteractions ? (
                          <>
                            <Ripple>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCommentsPostId(p.post_id)
                                  setCommentsOpen(true)
                                }}
                              >
                                Comments
                              </Button>
                            </Ripple>
                            <Ripple>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditPost(p.post_id)}
                              >
                                Edit
                              </Button>
                            </Ripple>
                            <Ripple>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDeletePost(p.post_id)}
                              >
                                Delete
                              </Button>
                            </Ripple>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCommentsPostId(p.post_id)
                                setCommentsOpen(true)
                              }}
                            >
                              Comments
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditPost(p.post_id)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDeletePost(p.post_id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mb-8 rounded-2xl border bg-surface p-6 text-sm text-muted-foreground">
            No posts yet. Share something to get started.
            <div className="mt-3">
              <Button variant="outline" onClick={reloadPosts} disabled={loadingPosts}>
                {loadingPosts ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {!readOnly && (
        <>
          <TabsContent value="profile">
            <ProfileForm userId={userId} initial={profile} />
          </TabsContent>
          <TabsContent value="account">
            <AccountForm />
          </TabsContent>
          <TabsContent value="privacy">
            <PrivacyForm userId={userId} initial={profile} />
          </TabsContent>
          <TabsContent value="monetization">
            <MonetizationForm userId={userId} />
          </TabsContent>
        </>
      )}

      {/* Followers/Following Dialogs */}
      <FollowersDialog
        userId={userId}
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        type="followers"
        viewerId={viewerId}
      />
      <FollowersDialog
        userId={userId}
        open={followingOpen}
        onOpenChange={setFollowingOpen}
        type="following"
        viewerId={viewerId}
      />
      <AvatarEditDialog
        userId={userId}
        initialUrl={profile.avatar_url}
        open={avatarEditOpen}
        onOpenChange={setAvatarEditOpen}
      />
    </Tabs>
  )
}
