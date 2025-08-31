-- Stats views & RPCs for VIORA
-- This file is versioned in the repo; run it in Supabase SQL Editor to apply.

-- SECURITY: make the view run with caller's privileges (respect RLS)
create or replace view public.v_post_stats
with (security_invoker = true)
as
select
  p.id                  as post_id,
  p.author_id,
  coalesce(pl.cnt, 0)   as likes_count,
  coalesce(pc.cnt, 0)   as comments_count,
  p.created_at
from public.posts p
left join (
  select post_id, count(*)::int as cnt
  from public.post_likes
  group by post_id
) pl on pl.post_id = p.id
left join (
  select post_id, count(*)::int as cnt
  from public.post_comments
  group by post_id
) pc on pc.post_id = p.id;

--    likes_received = sum(likes on user's posts)
create or replace view public.v_profile_stats
with (security_invoker = true)
as
select
  pr.id                       as user_id,
  coalesce(fwers.cnt, 0)      as followers_count,
  coalesce(fwing.cnt, 0)      as following_count,
  coalesce(pp.cnt, 0)         as posts_count,
  coalesce(likes.cnt, 0)      as likes_received,
  max(p.created_at)           as last_post_at
from public.profiles pr
left join (
  select followee_id, count(*)::int as cnt
  from public.follows
  group by followee_id
) fwers on fwers.followee_id = pr.id
left join (
  select follower_id, count(*)::int as cnt
  from public.follows
  group by follower_id
) fwing on fwing.follower_id = pr.id
left join (
  select author_id, count(*)::int as cnt
  from public.posts
  group by author_id
) pp on pp.author_id = pr.id
left join (
  select p.author_id, count(pl.*)::int as cnt
  from public.posts p
  join public.post_likes pl on pl.post_id = p.id
  group by p.author_id
) likes on likes.author_id = pr.id
left join public.posts p on p.author_id = pr.id
group by pr.id, fwers.cnt, fwing.cnt, pp.cnt, likes.cnt;

-- 3) RPC: get stats for a single profile (security invoker)
create or replace function public.get_profile_stats(target uuid)
returns table (
  user_id uuid,
  followers_count int,
  following_count int,
  posts_count int,
  likes_received int,
  last_post_at timestamptz
)
language sql
stable
as $$
  select * from public.v_profile_stats where user_id = target;
$$;

-- 4) RPC: get stats for a single post (security invoker)
create or replace function public.get_post_stats(pid uuid)
returns table (
  post_id uuid,
  author_id uuid,
  likes_count int,
  comments_count int,
  created_at timestamptz
)
language sql
stable
as $$
  select * from public.v_post_stats where post_id = pid;
$$;

-- 5) Helpful indexes (safe if already present)
create index if not exists idx_posts_author_created on public.posts (author_id, created_at desc);
create index if not exists idx_post_likes_post on public.post_likes (post_id);
create index if not exists idx_post_comments_post on public.post_comments (post_id);
create index if not exists idx_follows_followee on public.follows (followee_id);
create index if not exists idx_follows_follower on public.follows (follower_id);

-- 6) Minimal privileges for Supabase (expose views/RPCs)
grant select on public.v_post_stats, public.v_profile_stats to anon, authenticated;
grant execute on function public.get_profile_stats(uuid) to anon, authenticated;
grant execute on function public.get_post_stats(uuid) to anon, authenticated;

-- Notes:
-- - Functions are defined without SECURITY DEFINER, so they respect RLS (security invoker).
-- - Ensure your RLS policies on underlying tables allow the intended reads for the calling role.

-- 7) Harden function search_path (silence linter, safer resolution)
alter function public.get_profile_stats(uuid) set search_path = public, pg_temp;
alter function public.get_post_stats(uuid) set search_path = public, pg_temp;

