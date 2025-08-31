'use client'

import { Twitter, Instagram, Youtube, Globe } from 'lucide-react'

type SocialLinksProps = {
  links?: Array<{ name: 'twitter' | 'instagram' | 'youtube' | 'website' | string; url: string }>
  size?: 'sm' | 'md'
}

export default function SocialLinks({ links, size = 'md' }: SocialLinksProps) {
  if (!links || links.length === 0) {
    return null
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  }

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <Twitter className={iconSizes[size]} />
      case 'instagram':
        return <Instagram className={iconSizes[size]} />
      case 'youtube':
        return <Youtube className={iconSizes[size]} />
      case 'website':
      default:
        return <Globe className={iconSizes[size]} />
    }
  }

  const getPlatformName = (name: string) => {
    switch (name.toLowerCase()) {
      case 'twitter':
      case 'x':
        return 'Twitter'
      case 'instagram':
        return 'Instagram'
      case 'youtube':
        return 'YouTube'
      case 'website':
        return 'Website'
      default:
        return name
    }
  }

  return (
    <div className="flex items-center gap-3">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
          aria-label={`Visit ${getPlatformName(link.name)}`}
          title={`Visit ${getPlatformName(link.name)}`}
        >
          {getIcon(link.name)}
        </a>
      ))}
    </div>
  )
}
