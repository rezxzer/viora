export type ProfileData = {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  birthday: string | null // ISO date string
  links: Record<string, string> | null
  pronouns: string | null
  privacy_level?: 'public' | 'followers_only' | 'verified_only' | null
}
