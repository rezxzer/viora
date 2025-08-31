-- Restrict client roles on the sensitive view (idempotent & safe)

-- Revoke all permissions from client roles
REVOKE ALL ON public.v_comment_paid_reaction_stats FROM anon, authenticated;

-- Ensure service role can read (usually superuser, but explicit is fine)
GRANT SELECT ON public.v_comment_paid_reaction_stats TO service_role;
