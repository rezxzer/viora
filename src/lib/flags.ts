/**
 * Feature flags for profile UI enhancements
 * All flags default to false and can be enabled via environment variables
 */

// Helper function to safely read boolean environment variables
const readBool = (v?: string) => v === 'true'

export const flags = {
  /**
   * Enable animated cover gradients in profile header
   * NEXT_PUBLIC_ENABLE_COVER_GRADIENTS=true
   */
  coverGradients: readBool(process.env.NEXT_PUBLIC_ENABLE_COVER_GRADIENTS),

  /**
   * Enable avatar status rings (online/offline indicators)
   * NEXT_PUBLIC_ENABLE_AVATAR_RING=true
   */
  avatarRing: readBool(process.env.NEXT_PUBLIC_ENABLE_AVATAR_RING),

  /**
   * Enable featured media grid in profile
   * NEXT_PUBLIC_ENABLE_FEATURED_MEDIA=true
   */
  featuredMedia: readBool(process.env.NEXT_PUBLIC_ENABLE_FEATURED_MEDIA),

  /**
   * Enable gallery view toggle (list/grid)
   * NEXT_PUBLIC_ENABLE_GALLERY_TOGGLE=true
   */
  galleryToggle: readBool(process.env.NEXT_PUBLIC_ENABLE_GALLERY_TOGGLE),

  /**
   * Enable verification badge display
   * NEXT_PUBLIC_ENABLE_VERIFICATION_BADGE=true
   */
  verificationBadge: readBool(process.env.NEXT_PUBLIC_ENABLE_VERIFICATION_BADGE),

  /**
   * Enable micro-interactions (ripple effects)
   * NEXT_PUBLIC_ENABLE_MICRO_INTERACTIONS=true
   */
  microInteractions: readBool(process.env.NEXT_PUBLIC_ENABLE_MICRO_INTERACTIONS),

  /**
   * Enable enhanced stats badges (glass + glow)
   * NEXT_PUBLIC_ENABLE_STATS_BADGES=true
   */
  statsBadges: readBool(process.env.NEXT_PUBLIC_ENABLE_STATS_BADGES),

  /**
   * Enable header layout variants (compact/extended)
   * NEXT_PUBLIC_ENABLE_HEADER_LAYOUTS=true
   */
  headerLayouts: readBool(process.env.NEXT_PUBLIC_ENABLE_HEADER_LAYOUTS),

  /**
   * Enable about card with bio and interests
   * NEXT_PUBLIC_ENABLE_ABOUT_CARD=true
   */
  aboutCard: readBool(process.env.NEXT_PUBLIC_ENABLE_ABOUT_CARD),

  /**
   * Enable social media links display
   * NEXT_PUBLIC_ENABLE_SOCIAL_LINKS=true
   */
  socialLinks: readBool(process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LINKS),

  /**
   * Enable skeleton loading states
   * NEXT_PUBLIC_ENABLE_SKELETONS=true
   */
  skeletons: readBool(process.env.NEXT_PUBLIC_ENABLE_SKELETONS),

  /**
   * Enable verification request flow
   * NEXT_PUBLIC_ENABLE_VERIFICATION_FLOW=true
   */
  verificationFlow: readBool(process.env.NEXT_PUBLIC_ENABLE_VERIFICATION_FLOW),

  /**
   * Enable pinned/featured post management
   * NEXT_PUBLIC_ENABLE_PINNED_MANAGEMENT=true
   */
  pinnedManagement: readBool(process.env.NEXT_PUBLIC_ENABLE_PINNED_MANAGEMENT),

  /**
   * Enable gallery filters (All/Photos/Videos/Featured/Pinned)
   * NEXT_PUBLIC_ENABLE_GALLERY_FILTERS=true
   */
  galleryFilters: readBool(process.env.NEXT_PUBLIC_ENABLE_GALLERY_FILTERS),

  /**
   * Enable infinite scroll with cursor pagination
   * NEXT_PUBLIC_ENABLE_INFINITE_SCROLL=true
   */
  infiniteScroll: readBool(process.env.NEXT_PUBLIC_ENABLE_INFINITE_SCROLL),

  /**
   * Enable sticky profile subtabs (scroll behavior)
   * NEXT_PUBLIC_ENABLE_STICKY_PROFILE_TABS=false
   */
  stickyProfileTabs: readBool(process.env.NEXT_PUBLIC_ENABLE_STICKY_PROFILE_TABS),

  /**
   * Enable profile completion prompts and CTAs
   * NEXT_PUBLIC_ENABLE_PROFILE_COMPLETION=false
   */
  profileCompletion: readBool(process.env.NEXT_PUBLIC_ENABLE_PROFILE_COMPLETION),
} as const

// Development logging for QA
if (process.env.NODE_ENV === 'development') {
  // log once
  console.table(flags)
}

export type FeatureFlag = keyof typeof flags
