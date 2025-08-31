'use client'

import { useState } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ResolveButton({
  id,
  toStatus,
}: {
  id: string
  toStatus: 'reviewed' | 'resolved'
}) {
  const supabase = supabaseBrowserClient()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: toStatus,
          resolved_at: toStatus === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', id)
      if (error) throw error
      toast.success(`Marked ${toStatus}`)
      // naive reload to refresh server component list
      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={loading}
      variant={toStatus === 'resolved' ? 'default' : 'secondary'}
    >
      {loading ? '...' : toStatus === 'resolved' ? 'Resolve' : 'Review'}
    </Button>
  )
}
