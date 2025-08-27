import { notFound } from 'next/navigation'
import { getMockStreamById } from '@/lib/streams.mock'
import StreamSidebar from '@/components/streams/StreamSidebar'

type Params = { params: Promise<{ id: string }> }

export default async function StreamRoomPage({ params }: Params) {
  const { id } = await params
  const stream = await getMockStreamById(id)

  if (!stream) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        {/* Video Player */}
        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden">
            <video controls poster="/stream-placeholder.svg" className="w-full h-full object-cover">
              <source src="" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Mobile Stream Info */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Avatar</span>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold">{stream.title}</h1>
                <p className="text-muted-foreground">@{stream.creator.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:block">
          <StreamSidebar stream={stream} />
        </div>
      </div>
    </div>
  )
}
