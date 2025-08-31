'use client'

import { useEffect, useRef, useState } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type AvatarUploaderProps = {
  userId: string
  initialUrl: string | null
  onSuccess?: () => void
}

/**
 * AvatarUploader
 * - Accepts image files up to 5MB
 * - Uploads to: avatars/${userId}/avatar-${Date.now()}.${ext}
 * - Updates profiles.avatar_url with a public URL
 * - Emits a global event 'viora:avatar-updated' to update header instantly
 */
export default function AvatarUploader({ userId, initialUrl, onSuccess }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)

  // Create object URL preview when a new File is selected
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5MB')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
  }

  // Fake progress while uploading (Supabase fetch upload doesn't expose progress)
  useEffect(() => {
    let timer: number | undefined
    if (uploading) {
      setProgress(10)
      timer = window.setInterval(() => {
        setProgress((p) => (p < 90 ? p + 10 : p))
      }, 200)
    } else {
      setProgress(0)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [uploading])

  const handleUpload = async () => {
    const input = fileInputRef.current
    const file = input?.files?.[0]
    if (!file) {
      toast.error('Choose an image first')
      return
    }
    setUploading(true)
    const supabase = supabaseBrowserClient()

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    // Path inside the bucket must start with the userId to satisfy RLS
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message)
      return
    }

    // Obtain public URL
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = pub.publicUrl

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    setUploading(false)
    setProgress(100)

    if (updateError) {
      toast.error(updateError.message)
      return
    }

    toast.success('Avatar updated')
    setPreview(publicUrl)
    // Notify header to refresh avatar without full reload
    window.dispatchEvent(new CustomEvent('viora:avatar-updated', { detail: { url: publicUrl } }))

    // Call onSuccess callback if provided
    onSuccess?.()
  }

  return (
    <div className="space-y-4">
      {/* Avatar preview */}
      <div className="flex justify-center">
        <div className="h-24 w-24 overflow-hidden rounded-full border bg-elev shadow-soft">
          <img
            src={preview || '/avatar-placeholder.svg'}
            alt="Avatar preview"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="avatar"
        type="file"
        accept="image/*"
        aria-label="Choose avatar image"
        onChange={onFileChange}
        className="sr-only"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
          Select image
        </Button>
        <Button
          onClick={handleUpload}
          disabled={uploading || !preview || preview === initialUrl}
          className="flex-1"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>

      {/* Progress bar */}
      {uploading ? (
        <div className="h-2 w-full overflow-hidden rounded bg-elev">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  )
}
