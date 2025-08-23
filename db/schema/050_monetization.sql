-- Monetization minimal schema: creator_settings, subscription_plans, and supporting views (idempotent)

-- Requirements used by UI:
-- - creator_settings(user_id, is_monetized)
-- - subscription_plans(id, creator_id, name, price_cents, currency, is_active)
-- - v_creator_earnings(creator_id, total_gross_cents, total_creator_cents, total_platform_cents)
-- - v_creator_subscribers(creator_id, active_subscribers)

-- Ensure pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- creator_settings
-- =====================
CREATE TABLE IF NOT EXISTS public.creator_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_monetized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
DROP TRIGGER IF EXISTS tr_creator_settings_updated_at ON public.creator_settings;
CREATE TRIGGER tr_creator_settings_updated_at
BEFORE UPDATE ON public.creator_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.creator_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_settings_select_own ON public.creator_settings;
CREATE POLICY creator_settings_select_own ON public.creator_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS creator_settings_upsert_own ON public.creator_settings;
CREATE POLICY creator_settings_upsert_own ON public.creator_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS creator_settings_update_own ON public.creator_settings;
CREATE POLICY creator_settings_update_own ON public.creator_settings
  FOR UPDATE USING (auth.uid() = user_id);


-- =====================
-- subscription_plans
-- =====================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  currency text NOT NULL DEFAULT 'usd',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
DROP TRIGGER IF EXISTS tr_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER tr_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes to speed up access by creator and active status
CREATE INDEX IF NOT EXISTS idx_subscription_plans_creator ON public.subscription_plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public (or at least authenticated) read is useful for pricing display; keep wide-open SELECT for now
DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
CREATE POLICY subscription_plans_select_all ON public.subscription_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS subscription_plans_insert_own ON public.subscription_plans;
CREATE POLICY subscription_plans_insert_own ON public.subscription_plans
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS subscription_plans_update_own ON public.subscription_plans;
CREATE POLICY subscription_plans_update_own ON public.subscription_plans
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS subscription_plans_delete_own ON public.subscription_plans;
CREATE POLICY subscription_plans_delete_own ON public.subscription_plans
  FOR DELETE USING (auth.uid() = creator_id);


-- =====================
-- Supporting views for UI metrics (placeholder, safe defaults)
-- These views provide zeros when no ledger/payments tables exist yet.
-- =====================

DROP VIEW IF EXISTS public.v_creator_earnings CASCADE;
CREATE VIEW public.v_creator_earnings AS
SELECT
  cs.user_id AS creator_id,
  0::int AS total_gross_cents,
  0::int AS total_creator_cents,
  0::int AS total_platform_cents
FROM public.creator_settings cs;

DROP VIEW IF EXISTS public.v_creator_subscribers CASCADE;
CREATE VIEW public.v_creator_subscribers AS
SELECT
  cs.user_id AS creator_id,
  0::int AS active_subscribers
FROM public.creator_settings cs;

-- Harden views
ALTER VIEW public.v_creator_earnings SET (security_invoker = true);
ALTER VIEW public.v_creator_earnings SET (security_barrier = true);
ALTER VIEW public.v_creator_subscribers SET (security_invoker = true);
ALTER VIEW public.v_creator_subscribers SET (security_barrier = true);


