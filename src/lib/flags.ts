/**
 * Feature flags for profile UI enhancements
 * All flags default to false and can be enabled via environment variables
 */

export const flags = {
  /**
   * Enable animated cover gradients in profile header
   * NEXT_PUBLIC_ENABLE_COVER_GRADIENTS=true
   */
  coverGradients: process.env.NEXT_PUBLIC_ENABLE_COVER_GRADIENTS === 'true',

  /**
   * Enable avatar status rings (online/offline indicators)
   * NEXT_PUBLIC_ENABLE_AVATAR_RING=true
   */
  avatarRing: process.env.NEXT_PUBLIC_ENABLE_AVATAR_RING === 'true',

  /**
   * Enable featured media grid in profile
   * NEXT_PUBLIC_ENABLE_FEATURED_MEDIA=true
   */
  featuredMedia: process.env.NEXT_PUBLIC_ENABLE_FEATURED_MEDIA === 'true',
} as const

export type FeatureFlag = keyof typeof flags
