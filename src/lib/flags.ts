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

  /**
   * Enable gallery view toggle (list/grid)
   * NEXT_PUBLIC_ENABLE_GALLERY_TOGGLE=true
   */
  galleryToggle: process.env.NEXT_PUBLIC_ENABLE_GALLERY_TOGGLE === 'true',

  /**
   * Enable verification badge display
   * NEXT_PUBLIC_ENABLE_VERIFICATION_BADGE=true
   */
  verificationBadge: process.env.NEXT_PUBLIC_ENABLE_VERIFICATION_BADGE === 'true',

  /**
   * Enable micro-interactions (ripple effects)
   * NEXT_PUBLIC_ENABLE_MICRO_INTERACTIONS=true
   */
  microInteractions: process.env.NEXT_PUBLIC_ENABLE_MICRO_INTERACTIONS === 'true',

  /**
   * Enable enhanced stats badges (glass + glow)
   * NEXT_PUBLIC_ENABLE_STATS_BADGES=true
   */
  statsBadges: process.env.NEXT_PUBLIC_ENABLE_STATS_BADGES === 'true',

  /**
   * Enable header layout variants (compact/extended)
   * NEXT_PUBLIC_ENABLE_HEADER_LAYOUTS=true
   */
  headerLayouts: process.env.NEXT_PUBLIC_ENABLE_HEADER_LAYOUTS === 'true',

  /**
   * Enable about card with bio and interests
   * NEXT_PUBLIC_ENABLE_ABOUT_CARD=true
   */
  aboutCard: process.env.NEXT_PUBLIC_ENABLE_ABOUT_CARD === 'true',

  /**
   * Enable social media links display
   * NEXT_PUBLIC_ENABLE_SOCIAL_LINKS=true
   */
  socialLinks: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LINKS === 'true',

  /**
   * Enable skeleton loading states
   * NEXT_PUBLIC_ENABLE_SKELETONS=true
   */
  skeletons: process.env.NEXT_PUBLIC_ENABLE_SKELETONS === 'true',

  /**
   * Enable verification request flow
   * NEXT_PUBLIC_ENABLE_VERIFICATION_FLOW=true
   */
  verificationFlow: process.env.NEXT_PUBLIC_ENABLE_VERIFICATION_FLOW === 'true',

  /**
   * Enable pinned/featured post management
   * NEXT_PUBLIC_ENABLE_PINNED_MANAGEMENT=true
   */
  pinnedManagement: process.env.NEXT_PUBLIC_ENABLE_PINNED_MANAGEMENT === 'true',

  /**
   * Enable gallery filters (All/Photos/Videos/Featured/Pinned)
   * NEXT_PUBLIC_ENABLE_GALLERY_FILTERS=true
   */
  galleryFilters: process.env.NEXT_PUBLIC_ENABLE_GALLERY_FILTERS === 'true',

  /**
   * Enable infinite scroll with cursor pagination
   * NEXT_PUBLIC_ENABLE_INFINITE_SCROLL=true
   */
  infiniteScroll: process.env.NEXT_PUBLIC_ENABLE_INFINITE_SCROLL === 'true',
} as const

export type FeatureFlag = keyof typeof flags
