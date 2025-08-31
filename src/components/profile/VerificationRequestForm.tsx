'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { BadgeCheck, Upload, Send } from 'lucide-react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type VerificationRequestFormProps = {
  userId: string
  onSubmitted?: () => void
}

export default function VerificationRequestForm({
  userId,
  onSubmitted,
}: VerificationRequestFormProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Please provide a reason for verification')
      return
    }

    setIsSubmitting(true)
    const supabase = supabaseBrowserClient()

    try {
      const { error } = await supabase.from('verification_requests').insert({
        user_id: userId,
        reason: reason.trim(),
        status: 'pending',
      })

      if (error) {
        if (error.code === '42501') {
          toast.error('Not authorized to submit verification request')
        } else {
          toast.error('Failed to submit verification request')
        }
        return
      }

      toast.success('Verification request submitted successfully')
      setReason('')
      onSubmitted?.()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <BadgeCheck className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Get Verified</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Submit a verification request to get a verified badge on your profile.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-2">
            Why should you be verified?
          </label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you should be verified (e.g., public figure, notable achievements, etc.)"
            className="min-h-[100px]"
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground mt-1">{reason.length}/500 characters</div>
        </div>

        <Button type="submit" disabled={isSubmitting || !reason.trim()} className="w-full">
          {isSubmitting ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-pulse" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
