'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Props = { creatorId: string }

export default function TipDialog({ creatorId }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number>(500)
  const [isPending, startTransition] = useTransition()

  const presets = [200, 500, 1000, 2000]

  const onSend = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/monetization/tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId, amountCents: amount, currency: 'usd' }),
        })
        if (!res.ok) throw new Error(await res.text())
        setOpen(false)
        toast.success('Tip sent. Thank you!')
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed'
        toast.error(msg)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Send tip</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a tip</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 flex-wrap">
          {presets.map((p) => (
            <Button
              key={p}
              variant={p === amount ? 'default' : 'secondary'}
              onClick={() => setAmount(p)}
            >
              ${(p / 100).toFixed(2)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Custom (cents)</span>
          <Input value={amount} onChange={(e) => setAmount(Number(e.target.value || 0))} />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSend} disabled={isPending}>
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
