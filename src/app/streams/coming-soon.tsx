import { Radio, Clock, Users, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function StreamsComingSoonPage() {
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
            Live Streaming Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We&apos;re working hard to bring you an amazing live streaming experience. Get ready to
            go live, connect with your audience, and share your moments in real-time.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">High Quality Streaming</h3>
            <p className="text-sm text-muted-foreground">
              Crystal clear video and audio for the best viewer experience
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Real-time Interaction</h3>
            <p className="text-sm text-muted-foreground">
              Live chat, reactions, and audience engagement tools
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">24/7 Availability</h3>
            <p className="text-sm text-muted-foreground">
              Stream anytime, anywhere with our reliable platform
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
              <Link href="/feed">Explore Feed</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">Update Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
