'use client'

import { MapPin, Globe, Tag, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type AboutCardProps = {
  bio?: string
  location?: string
  website?: string
  interests?: string[]
  isOwner?: boolean
  onEditProfile?: () => void
}

export default function AboutCard({
  bio,
  location,
  website,
  interests,
  isOwner = false,
  onEditProfile,
}: AboutCardProps) {
  // Helper function to normalize and validate field values
  const normalizeField = (v?: string | null) =>
    v && v.trim() && !/^[-–—_]+$/.test(v) && v.trim().toLowerCase() !== 's' ? v.trim() : ''

  const normalizedBio = normalizeField(bio)
  const normalizedLocation = normalizeField(location)
  const normalizedWebsite = normalizeField(website)
  const hasInterests = interests && interests.length > 0

  const hasContent = normalizedBio || normalizedLocation || normalizedWebsite || hasInterests

  if (!hasContent && !isOwner) {
    return null
  }

  return (
    <Card className="mb-6 p-6 hover:ring-1 hover:ring-primary/20 transition-all duration-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        About
      </h3>

      <div className="space-y-4">
        {/* Bio */}
        {normalizedBio ? (
          <div>
            <p className="text-muted-foreground leading-relaxed">{normalizedBio}</p>
          </div>
        ) : isOwner ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onEditProfile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEditProfile?.()
              }
            }}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-lg ring-1 ring-white/5 hover:ring-primary/30 transition cursor-pointer"
            aria-label="Add bio"
          >
            <Plus className="h-4 w-4" />
            Add bio
          </div>
        ) : null}

        {/* Location & Website */}
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          {normalizedLocation ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{normalizedLocation}</span>
            </div>
          ) : isOwner ? (
            <div
              role="button"
              tabIndex={0}
              onClick={onEditProfile}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onEditProfile?.()
                }
              }}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-lg ring-1 ring-white/5 hover:ring-primary/30 transition cursor-pointer"
              aria-label="Add location"
            >
              <Plus className="h-4 w-4" />
              Add location
            </div>
          ) : null}

          {normalizedWebsite ? (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a
                href={normalizedWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline hover:ring-1 hover:ring-primary/20 hover:bg-primary/5 px-1 py-0.5 rounded transition-all duration-200"
              >
                {normalizedWebsite.replace(/^https?:\/\//, '')}
              </a>
            </div>
          ) : isOwner ? (
            <div
              role="button"
              tabIndex={0}
              onClick={onEditProfile}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onEditProfile?.()
                }
              }}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-lg ring-1 ring-white/5 hover:ring-primary/30 transition cursor-pointer"
              aria-label="Add website"
            >
              <Plus className="h-4 w-4" />
              Add website
            </div>
          ) : null}
        </div>

        {/* Interests */}
        {hasInterests && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30 transition-all duration-200"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
