'use client'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  playbackUrl?: string | null // e.g. https://stream.mux.com/XXX.m3u8
  autoPlay?: boolean
  muted?: boolean
  poster?: string
}

type HlsInstance = {
  on: (event: string, callback: (event: string, data: HlsErrorData) => void) => void
  loadSource: (url: string) => void
  attachMedia: (element: HTMLVideoElement) => void
  startLoad: () => void
  recoverMediaError: () => void
  destroy: () => void
}

type HlsErrorData = {
  fatal: boolean
  type: string
}

export default function StreamPlayer({
  playbackUrl,
  autoPlay = true,
  muted = true,
  poster,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>('Initializing...')

  useEffect(() => {
    let hls: HlsInstance | null = null

    async function setup() {
      const video = videoRef.current
      if (!video) return

      if (!playbackUrl) {
        setErrorMsg('No playback URL')
        setStatusText('No playback URL')
        return
      }

      setStatusText('Loading player...')

      // Native HLS (Safari / iOS)
      if (video.canPlayType('application/vnd.apple.mpegURL')) {
        video.src = playbackUrl
        try {
          if (autoPlay) await video.play().catch(() => {})
          setStatusText('Playing (native HLS)')
        } catch {
          setErrorMsg('Native HLS error')
        }
        return
      }

      // hls.js fallback for other browsers
      try {
        const mod = await import('hls.js')
        const Hls = mod.default
        if (!Hls.isSupported()) {
          setErrorMsg('HLS not supported')
          return
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          maxLiveSyncPlaybackRate: 1.5,
        }) as HlsInstance

        hls.on(Hls.Events.ERROR, (_e: string, data: HlsErrorData) => {
          if (data?.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad()
                setStatusText('Reconnecting...')
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError()
                setStatusText('Recovering media...')
                break
              default:
                setErrorMsg('Fatal HLS error')
                hls?.destroy()
            }
          }
        })

        hls.loadSource(playbackUrl)
        hls.attachMedia(video)

        video.addEventListener('loadedmetadata', () => {
          setStatusText('Loaded')
          if (autoPlay) video.play().catch(() => {})
        })
        video.addEventListener('waiting', () => setStatusText('Buffering...'))
        video.addEventListener('playing', () => setStatusText('Live'))
      } catch {
        setErrorMsg('Failed to init HLS')
      }
    }

    setup()
    return () => {
      try {
        hls?.destroy()
      } catch {}
    }
  }, [playbackUrl, autoPlay])

  if (!playbackUrl) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-neutral-900 text-neutral-300">
        <div className="text-center">
          <div className="text-lg font-semibold">Unknown Status</div>
          <div className="text-sm opacity-70">No playback URL</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        controls
        playsInline
        muted={muted}
        poster={poster}
        className="w-full rounded-2xl bg-black"
      />
      <div className="absolute left-3 bottom-3 px-2 py-1 rounded bg-black/60 text-white text-xs">
        {errorMsg ?? statusText}
      </div>
    </div>
  )
}
