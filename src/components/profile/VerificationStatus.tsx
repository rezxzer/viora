'use client'

import { useState, useEffect } from 'react'
import { BadgeCheck, Clock, XCircle, CheckCircle } from 'lucide-react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type VerificationStatusProps = {
  userId: string
  isVerified: boolean
}

type VerificationRequest = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  created_at: string
  reviewed_at?: string
}

export default function VerificationStatus({ userId, isVerified }: VerificationStatusProps) {
  const [request, setRequest] = useState<VerificationRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVerificationRequest = async () => {
      const supabase = supabaseBrowserClient()

      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          toast.error('Failed to load verification status')
          return
        }

        setRequest(data)
      } catch (error) {
        console.error('Error fetching verification request:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVerificationRequest()
  }, [userId])

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
        <div className="h-4 w-4 skeleton rounded-full" />
        <span>Loading...</span>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>Verified</span>
      </div>
    )
  }

  if (request?.status === 'approved') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
        <BadgeCheck className="h-4 w-4" />
        <span>Verification Approved</span>
      </div>
    )
  }

  if (request?.status === 'rejected') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm">
        <XCircle className="h-4 w-4" />
        <span>Verification Rejected</span>
      </div>
    )
  }

  if (request?.status === 'pending') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
        <Clock className="h-4 w-4" />
        <span>Verification Pending</span>
      </div>
    )
  }

  return null
}
