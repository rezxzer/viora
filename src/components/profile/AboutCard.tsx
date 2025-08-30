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
  const hasContent = bio || location || website || (interests && interests.length > 0)

  if (!hasContent && !isOwner) {
    return null
  }

  return (
    <Card className="mb-6 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        About
      </h3>

      <div className="space-y-4">
        {/* Bio */}
        {bio ? (
          <div>
            <p className="text-muted-foreground leading-relaxed">{bio}</p>
          </div>
        ) : isOwner ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditProfile}
            className="h-auto p-0 text-muted-foreground hover:text-foreground justify-start"
            aria-label="Add bio"
            title="Add bio"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add bio
          </Button>
        ) : null}

        {/* Location & Website */}
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          {location ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          ) : isOwner ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditProfile}
              className="h-auto p-0 text-muted-foreground hover:text-foreground justify-start"
              aria-label="Add location"
              title="Add location"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add location
            </Button>
          ) : null}

          {website ? (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          ) : isOwner ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditProfile}
              className="h-auto p-0 text-muted-foreground hover:text-foreground justify-start"
              aria-label="Add website"
              title="Add website"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add website
            </Button>
          ) : null}
        </div>

        {/* Interests */}
        {interests && interests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
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
