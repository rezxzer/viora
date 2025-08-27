'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type ProfileLite = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

type Props = {
  userId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  type: 'followers' | 'following'
  viewerId: string | null
}

export default function FollowersDialog({ userId, open, onOpenChange, type, viewerId }: Props) {
  const supabase = supabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [isFollowing, setIsFollowing] = useState<Set<string>>(new Set())

  const loadProfiles = async () => {
    if (!open) return
    setLoading(true)
    try {
      let query
      if (type === 'followers') {
        // Get users who follow this user
        query = supabase.from('follows').select('follower_id').eq('followee_id', userId)
      } else {
        // Get users this user follows
        query = supabase.from('follows').select('followee_id').eq('follower_id', userId)
      }

      const { data, error } = await query
      if (error) throw error

      const userIds = data.map((row) => {
        if (type === 'followers') {
          return (row as { follower_id: string }).follower_id
        } else {
          return (row as { followee_id: string }).followee_id
        }
      })

      if (userIds.length === 0) {
        setProfiles([])
        setIsFollowing(new Set())
        return
      }

      // Get profile details
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)
        .order('username', { ascending: true })

      if (pErr) throw pErr
      setProfiles(profs || [])

      // Check if viewer is following these users (for both followers and following)
      if (viewerId) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('followee_id')
          .eq('follower_id', viewerId)
          .in('followee_id', userIds)

        const followingSet = new Set(followingData?.map((r) => r.followee_id) || [])
        setIsFollowing(followingSet)
      } else {
        setIsFollowing(new Set())
      }
    } catch (e) {
      toast.error('Failed to load profiles')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [open, userId, type])

  const toggleFollow = async (targetUserId: string) => {
    if (!viewerId) {
      toast.info('Sign in to follow')
      return
    }

    console.log('toggleFollow called:', { targetUserId, viewerId, type })
    console.log('Current isFollowing state:', Array.from(isFollowing))

    const isCurrentlyFollowing = isFollowing.has(targetUserId)
    console.log('Is currently following:', isCurrentlyFollowing)

    try {
      if (isCurrentlyFollowing) {
        console.log('Attempting to unfollow...')
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('followee_id', targetUserId)
        if (error) throw error

        setIsFollowing((prev) => {
          const next = new Set(prev)
          next.delete(targetUserId)
          return next
        })
        toast.success('Unfollowed')
      } else {
        console.log('Attempting to follow...')
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: viewerId, followee_id: targetUserId })
        if (error) throw error

        setIsFollowing((prev) => new Set(prev).add(targetUserId))
        toast.success('Followed')
      }
    } catch (e) {
      console.error('Error in toggleFollow:', e)
      toast.error('Failed to update follow status')
    }
  }

  const getDisplayName = (profile: ProfileLite) => {
    return profile.full_name || profile.username || 'Unknown User'
  }

  const getUsername = (profile: ProfileLite) => {
    return profile.username ? `@${profile.username}` : ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <UserAvatar
                    src={profile.avatar_url}
                    fallback={getDisplayName(profile)}
                    className="w-10 h-10"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{getDisplayName(profile)}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {getUsername(profile)}
                    </div>
                  </div>

                  {viewerId && profile.id !== viewerId && (
                    <Button
                      size="sm"
                      variant={isFollowing.has(profile.id) ? 'outline' : 'default'}
                      onClick={() => toggleFollow(profile.id)}
                      className="shrink-0"
                    >
                      {isFollowing.has(profile.id) ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
