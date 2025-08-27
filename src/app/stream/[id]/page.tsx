import { notFound } from 'next/navigation'
import { getStreamWithLastSession } from '@/lib/streams'
import StreamSidebar from '@/components/streams/StreamSidebar'

type Params = { params: Promise<{ id: string }> }

export default async function StreamRoomPage({ params }: Params) {
  const { id } = await params

  try {
    const { stream, session } = await getStreamWithLastSession(id)

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* Video Player */}
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-xl overflow-hidden">
              {stream.status === 'live' && session?.hls_url ? (
                <video controls className="w-full h-full object-cover">
                  <source src={session.hls_url} type="application/x-mpegURL" />
                  Your browser does not support HLS video.
                </video>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <img
                    src="/stream-placeholder.svg"
                    alt="Stream offline"
                    className="w-32 h-32 opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Mobile Stream Info */}
            <div className="lg:hidden space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Avatar</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold">{stream.title}</h1>
                  <p className="text-muted-foreground">Status: {stream.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:block">
            <StreamSidebar stream={stream} session={session} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading stream:', error)
    notFound()
  }
}
