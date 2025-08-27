import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Users, Clock } from 'lucide-react'

export default function CreatorStreamsPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="text-muted-foreground">Manage your streams and content</p>
      </div>

      {/* Start Stream Section */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Start a New Stream</h2>
            <p className="text-muted-foreground">Go live and connect with your audience</p>
          </div>
        </div>

        <Button disabled className="w-full sm:w-auto" title="Real streaming setup coming soon">
          <Play className="w-4 h-4 mr-2" />
          Start Stream
        </Button>
      </div>

      {/* Past Streams Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Past Streams</h2>
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm">Your stream history will appear here</p>
        </div>
      </div>

      {/* Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Total Streams</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Total Viewers</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">0h</p>
          <p className="text-sm text-muted-foreground">Stream Time</p>
        </div>
      </div>
    </div>
  )
}
