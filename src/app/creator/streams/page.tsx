'use client'

import { Radio, Video, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CreatorStreamsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-16 space-y-8">
        {/* Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mx-auto flex items-center justify-center">
          <Radio className="w-16 h-16 text-primary" />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Creator Tools Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We&apos;re building powerful tools for creators to go live, manage streams, and connect
            with their audience. Get ready for an amazing streaming experience.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Stream Management</h3>
            <p className="text-sm text-muted-foreground">
              Create, schedule, and manage your live streams easily
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Audience Insights</h3>
            <p className="text-sm text-muted-foreground">
              Track viewer engagement and stream performance metrics
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Advanced Controls</h3>
            <p className="text-sm text-muted-foreground">
              Professional streaming tools and customization options
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Stay tuned for updates and be the first to know when we launch!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/profile">Update Profile</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/feed">Explore Feed</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
