'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type Plan = {
  id?: string
  name: string
  price_cents: number
  currency: string
  is_active: boolean
}

type Props = { userId: string }

const planSchema = z.object({
  name: z.string().min(2),
  price_cents: z.coerce.number().int().positive(),
  currency: z
    .string()
    .min(3)
    .max(3)
    .transform((v) => v.toLowerCase()),
  is_active: z.boolean().default(true),
})

export default function MonetizationForm({ userId }: Props) {
  const supabase = supabaseBrowserClient()
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState<boolean>(false)
  const [savingEnabled, setSavingEnabled] = useState(false)

  const [plan, setPlan] = useState<Plan>({
    name: 'Supporter',
    price_cents: 500,
    currency: 'usd',
    is_active: true,
  })
  const [savingPlan, setSavingPlan] = useState(false)

  const [totalTipsCents, setTotalTipsCents] = useState<number>(0)
  const [totalPlatformCents, setTotalPlatformCents] = useState<number>(0)
  const [activeSubscribersCount, setActiveSubscribersCount] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [{ data: settings }, { data: planRow }]: [
          { data: { is_monetized: boolean } | null },
          { data: Plan | null },
        ] = await Promise.all([
          supabase
            .from('creator_settings')
            .select('is_monetized')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('subscription_plans')
            .select('id, name, price_cents, currency, is_active')
            .eq('creator_id', userId)
            .eq('is_active', true)
            .maybeSingle(),
        ])
        if (!cancelled) {
          setEnabled(!!settings?.is_monetized)
          if (planRow) setPlan({ ...(planRow as Plan) })
        }

        // Try to load totals from a view if available; fall back to 0 silently
        try {
          const {
            data: earn,
          }: {
            data: {
              creator_id: string
              total_gross_cents: number
              total_creator_cents: number
              total_platform_cents?: number
            } | null
          } = await supabase
            .from('v_creator_earnings')
            .select('creator_id, total_gross_cents, total_creator_cents, total_platform_cents')
            .eq('creator_id', userId)
            .maybeSingle()
          if (!cancelled && earn) {
            setTotalTipsCents(earn.total_gross_cents ?? 0)
            setTotalPlatformCents(earn.total_platform_cents ?? 0)
          }
        } catch {}

        // Subscribers metric placeholder (depends on subscriptions table not yet defined)
        try {
          const {
            data: subsCount,
          }: { data: { creator_id: string; active_subscribers: number } | null } = await supabase
            .from('v_creator_subscribers')
            .select('creator_id, active_subscribers')
            .eq('creator_id', userId)
            .maybeSingle()
          if (!cancelled && subsCount) setActiveSubscribersCount(subsCount.active_subscribers ?? 0)
        } catch {
          // default 0
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [supabase, userId])

  const onSaveEnabled = async () => {
    setSavingEnabled(true)
    const { error } = await supabase
      .from('creator_settings')
      .upsert({ user_id: userId, is_monetized: enabled }, { onConflict: 'user_id' })
    setSavingEnabled(false)
    if (error) return toast.error(error.message)
    toast.success('Monetization setting saved')
  }

  const onSavePlan = async () => {
    const parsed = planSchema.safeParse(plan)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid plan')
      return
    }
    setSavingPlan(true)
    if (plan.id) {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: plan.name,
          price_cents: plan.price_cents,
          currency: plan.currency,
          is_active: plan.is_active,
        })
        .eq('id', plan.id)
        .eq('creator_id', userId)
      setSavingPlan(false)
      if (error) return toast.error(error.message)
    } else {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          creator_id: userId,
          name: plan.name,
          price_cents: plan.price_cents,
          currency: plan.currency,
          is_active: plan.is_active,
        })
        .select('id')
        .single()
      setSavingPlan(false)
      if (error) return toast.error(error.message)
      setPlan((p) => ({ ...p, id: data.id }))
    }
    toast.success('Plan saved')
  }

  const onDeletePlan = async () => {
    if (!plan.id) return
    setSavingPlan(true)
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', plan.id)
      .eq('creator_id', userId)
    setSavingPlan(false)
    if (error) return toast.error(error.message)
    setPlan({ name: 'Supporter', price_cents: 500, currency: 'usd', is_active: true })
    toast.success('Plan disabled')
  }

  const fmt = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: plan.currency || 'usd',
  })
  const planDisabled = !enabled
  const payoutCents = Math.max((totalTipsCents || 0) - (totalPlatformCents || 0), 0)
  const platformPct =
    (totalTipsCents || 0) > 0
      ? Math.min(100, Math.max(0, (totalPlatformCents / totalTipsCents) * 100))
      : 0

  return (
    <div className="space-y-6">
      {null}
      <div className="rounded-2xl border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Enable monetization</div>
            <div className="text-sm text-muted-foreground">
              Allow subscriptions and tips for your profile.
            </div>
          </div>
          <input
            type="checkbox"
            aria-label="Enable monetization"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>
        <div className="mt-3">
          <Button onClick={onSaveEnabled} disabled={savingEnabled}>
            {savingEnabled ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div
        className={
          'rounded-2xl border bg-surface p-4 shadow-soft space-y-3 ' +
          (planDisabled ? 'opacity-60 pointer-events-none' : '')
        }
      >
        <div className="font-medium">Monthly plan</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Plan name"
            value={plan.name}
            onChange={(e) => setPlan({ ...plan, name: e.target.value })}
            disabled={planDisabled}
          />
          <Input
            placeholder="Price (cents)"
            type="number"
            min={1}
            step={1}
            value={plan.price_cents}
            onChange={(e) => setPlan({ ...plan, price_cents: Number(e.target.value || 0) })}
            disabled={planDisabled}
          />
          <select
            aria-label="Currency"
            value={plan.currency}
            onChange={(e) => setPlan({ ...plan, currency: e.target.value })}
            disabled={planDisabled}
            className="h-10 w-full rounded-2xl border border-input bg-surface px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label="Active"
            checked={plan.is_active}
            onChange={(e) => setPlan({ ...plan, is_active: e.target.checked })}
            disabled={planDisabled}
          />
          <span className="text-sm">Active</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSavePlan} disabled={savingPlan || planDisabled}>
            {savingPlan ? 'Saving...' : 'Save plan'}
          </Button>
          {plan.id ? (
            <Button
              variant="destructive"
              onClick={onDeletePlan}
              disabled={savingPlan || planDisabled}
            >
              Disable
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border bg-surface p-4 shadow-soft">
        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-7 w-24 animate-pulse rounded bg-elev" />
              <div className="h-3 w-20 animate-pulse rounded bg-elev" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-24 animate-pulse rounded bg-elev" />
              <div className="h-3 w-20 animate-pulse rounded bg-elev" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-24 animate-pulse rounded bg-elev" />
              <div className="h-3 w-20 animate-pulse rounded bg-elev" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xl font-semibold">{fmt.format(payoutCents / 100)}</div>
                <div className="text-xs text-muted-foreground">Payout estimate</div>
                <div className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  Platform fee ~{Math.round(platformPct)}%
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Platform fees: {fmt.format((totalPlatformCents || 0) / 100)}
                </div>
              </div>
              <div>
                <div className="text-xl font-semibold">
                  {fmt.format((totalTipsCents || 0) / 100)}
                </div>
                <div className="text-xs text-muted-foreground">Total tips</div>
              </div>
              <div>
                <div className="text-xl font-semibold">{activeSubscribersCount}</div>
                <div className="text-xs text-muted-foreground">Active subscribers</div>
              </div>
            </div>
            {totalTipsCents === 0 && activeSubscribersCount === 0 ? (
              <div className="mt-3 text-sm text-muted-foreground">
                No earnings yet — share your profile link to get started.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
