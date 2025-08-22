'use client'

import { useRef, useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type Props = {
  userId: string
  avatarUrl: string | null
}

export default function Composer({ userId, avatarUrl }: Props) {
  const supabase = supabaseBrowserClient()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const onPick = () => fileRef.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? [])
    if (incoming.length === 0) return
    const MAX_FILES = 4

    // Validate and filter by type/size
    const validIncoming: File[] = []
    for (const f of incoming) {
      const isSupported = f.type.startsWith('image/') || f.type.startsWith('video/')
      if (!isSupported) {
        toast.error(`Unsupported file type: ${f.name}`)
        continue
      }
      if (f.size > 15 * 1024 * 1024) {
        toast.error(`File too large: ${f.name} (max 15MB)`)
        continue
      }
      validIncoming.push(f)
    }

    // Merge with existing selections, keep order (existing first), de-dup by name+size
    const byKey = new Map<string, File>()
    for (const f of files) byKey.set(`${f.name}_${f.size}`, f)
    for (const f of validIncoming)
      if (!byKey.has(`${f.name}_${f.size}`)) byKey.set(`${f.name}_${f.size}`, f)

    const merged = Array.from(byKey.values()).slice(0, MAX_FILES)
    setFiles(merged)

    // Build previews, revoking old ones first
    try {
      previews.forEach((u) => URL.revokeObjectURL(u))
    } catch {}
    const nextPreviews = merged.map((f) => URL.createObjectURL(f))
    setPreviews(nextPreviews)

    // Clear input so the same file can be re-selected if needed
    ;(e.target as HTMLInputElement).value = ''
  }

  const onPost = () => {
    startTransition(async () => {
      try {
        // First create the post
        const { data: created, error: postErr } = await supabase
          .from('posts')
          .insert({ author_id: userId, content: text || null, image_url: null, is_public: true })
          .select('id')
          .single()
        if (postErr) throw postErr

        // Upload assets (if any)
        if (files.length > 0) {
          const uploaded: Array<{ url: string; mime_type: string }> = []
          for (let i = 0; i < files.length; i++) {
            const f = files[i]
            const ext = f.name.split('.').pop() || 'bin'
            const path = `${userId}/${Date.now()}-${i}.${ext}`
            const { error: upErr } = await supabase.storage.from('post-media').upload(path, f, {
              upsert: false,
              contentType: f.type,
            })
            if (upErr) throw upErr
            const { data: pub } = supabase.storage.from('post-media').getPublicUrl(path)
            uploaded.push({ url: pub.publicUrl, mime_type: f.type || 'application/octet-stream' })
          }
          // Insert assets rows
          const rows = uploaded.map((u) => ({
            post_id: created.id,
            url: u.url,
            mime_type: u.mime_type,
          }))
          const { error: assetsErr } = await supabase.from('post_assets').insert(rows)
          if (assetsErr) throw assetsErr

          // Back-compat: set cover image on the post for fast display in feed
          const cover = uploaded.find((u) => u.mime_type.startsWith('image/'))?.url ?? null
          if (cover) {
            await supabase.from('posts').update({ image_url: cover }).eq('id', created.id)
          }
        }

        setText('')
        setFiles([])
        try {
          previews.forEach((u) => URL.revokeObjectURL(u))
        } catch {}
        setPreviews([])
        toast.success('Posted')
        // Ask feed to refresh
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to post'
        toast.error(msg)
      }
    })
  }

  return (
    <Card aria-label="Composer">
      <CardContent className="pt-6">
        <div
          className="flex items-start gap-3"
          onDragOver={(e) => {
            e.preventDefault()
          }}
          onDrop={(e) => {
            e.preventDefault()
            const dtFiles = Array.from(e.dataTransfer?.files ?? [])
            if (dtFiles.length) {
              const inputLike = {
                target: { files: dtFiles },
              } as unknown as React.ChangeEvent<HTMLInputElement>
              onFile(inputLike)
            }
          }}
        >
          <Avatar>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="avatar" />
            ) : (
              <AvatarFallback>U</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <label htmlFor="composer" className="sr-only">
              What’s happening?
            </label>
            <Textarea
              id="composer"
              className="min-h-16 resize-none"
              placeholder="What’s happening?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={onFile}
                  accept="image/*,video/*"
                  multiple
                />
                <Button variant="outline" onClick={onPick} aria-label="Upload media">
                  Upload
                </Button>
                {files.length ? (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {files.length === 1 ? files[0].name : `${files.length} files`}
                  </span>
                ) : null}
              </div>
              <Button
                onClick={onPost}
                disabled={isPending || (!text && files.length === 0)}
                aria-label="Post"
              >
                {isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
            {previews.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {previews.map((url, idx) => {
                  const file = files[idx]
                  const isImage = file?.type.startsWith('image/')
                  return (
                    <div
                      key={url + idx}
                      className="relative aspect-square overflow-hidden rounded-lg border"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt="preview"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <video src={url} className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          type="button"
                          className="h-7 w-7 rounded bg-black/60 text-white grid place-items-center"
                          onClick={() => {
                            setFiles((prev) => prev.filter((_, i) => i !== idx))
                            setPreviews((prev) => {
                              try {
                                URL.revokeObjectURL(prev[idx])
                              } catch {}
                              return prev.filter((_, i) => i !== idx)
                            })
                          }}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                      {files.length > 1 ? (
                        <div className="absolute bottom-1 right-1 flex gap-1">
                          <button
                            type="button"
                            className="h-7 px-2 rounded bg-black/60 text-white"
                            onClick={() => {
                              if (idx <= 0) return
                              setFiles((prev) => {
                                const copy = [...prev]
                                const [f] = copy.splice(idx, 1)
                                copy.splice(idx - 1, 0, f)
                                return copy
                              })
                              setPreviews((prev) => {
                                const copy = [...prev]
                                const [u] = copy.splice(idx, 1)
                                copy.splice(idx - 1, 0, u)
                                return copy
                              })
                            }}
                            aria-label="Move left"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            className="h-7 px-2 rounded bg-black/60 text-white"
                            onClick={() => {
                              if (idx >= files.length - 1) return
                              setFiles((prev) => {
                                const copy = [...prev]
                                const [f] = copy.splice(idx, 1)
                                copy.splice(idx + 1, 0, f)
                                return copy
                              })
                              setPreviews((prev) => {
                                const copy = [...prev]
                                const [u] = copy.splice(idx, 1)
                                copy.splice(idx + 1, 0, u)
                                return copy
                              })
                            }}
                            aria-label="Move right"
                          >
                            →
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                Drag & drop images or videos here (up to 4)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
