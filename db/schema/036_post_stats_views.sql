-- File: db/schema/036_post_stats_views.sql
-- Views for post statistics (likes/comments counts) with security_invoker

-- The views aggregate counts from tables that are protected by RLS.
-- We set security_invoker = on so that access checks are evaluated
-- using the privileges/RLS of the caller, not the view owner.

create or replace view public.v_post_stats as
select
  p.id          as post_id,
  p.author_id   as author_id,
  p.created_at  as created_at,
  coalesce(lc.cnt, 0) as likes_count,
  coalesce(cc.cnt, 0) as comments_count
from public.posts p
left join (
  select post_id, count(*)::int as cnt
  from public.post_likes
  group by post_id
) lc on lc.post_id = p.id
left join (
  select post_id, count(*)::int as cnt
  from public.comments
  group by post_id
) cc on cc.post_id = p.id;

create or replace view public.v_post_stats_public as
select
  post_id,
  author_id,
  created_at,
  likes_count,
  comments_count
from public.v_post_stats;

-- Ensure the views run with caller's privileges (not the creator's)
alter view public.v_post_stats set (security_invoker = on);
alter view public.v_post_stats_public set (security_invoker = on);

-- Optional: allow API roles to read these views
do $$
begin
  perform 1;
  -- Grants are idempotent by nature; running them repeatedly is safe
  grant select on public.v_post_stats to anon, authenticated;
  grant select on public.v_post_stats_public to anon, authenticated;
exception when others then
  -- In case roles are renamed/absent in local dev, ignore
  null;
end$$;


