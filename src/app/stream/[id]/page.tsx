import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function StreamDetailPage() {
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
            Individual stream pages are not available yet. We&apos;re working hard to bring you an
            amazing live streaming experience with detailed stream views.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Stay tuned for updates and be the first to know when we launch!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/streams">Back to Streams</Link>
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
