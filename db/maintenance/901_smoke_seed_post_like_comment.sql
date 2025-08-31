-- File: db/maintenance/901_smoke_seed_post_like_comment.sql
-- Purpose: Create a tiny smoke dataset (1 post, 1 like, 1 comment) idempotently

do $$
declare
  v_author_id uuid;
  v_actor_id uuid;
  v_post_id uuid;
begin
  -- pick first user as author, second user as actor (fallback to author)
  select id into v_author_id from auth.users order by created_at asc limit 1;
  if v_author_id is null then
    raise exception 'No users in auth.users; sign up at least one user first.';
  end if;
  select id into v_actor_id from auth.users where id <> v_author_id order by created_at asc limit 1;
  if v_actor_id is null then
    v_actor_id := v_author_id;
  end if;

  -- ensure author profile exists
  insert into public.profiles(id)
  values (v_author_id)
  on conflict (id) do nothing;

  -- create or reuse a deterministic smoke post
  select p.id into v_post_id from public.posts p where p.author_id = v_author_id and p.content = 'SMOKE_POST' limit 1;
  if v_post_id is null then
    insert into public.posts(author_id, content)
    values (v_author_id, 'SMOKE_POST')
    returning id into v_post_id;
  end if;

  -- like once (idempotent)
  insert into public.post_likes(post_id, user_id)
  values (v_post_id, v_actor_id)
  on conflict (post_id, user_id) do nothing;

  -- add one comment if none exists yet from the actor
  if not exists (
    select 1 from public.comments c where c.post_id = v_post_id and c.author_id = v_actor_id and c.content = 'Smoke comment'
  ) then
    insert into public.comments(post_id, author_id, content)
    values (v_post_id, v_actor_id, 'Smoke comment');
  end if;
end$$;

-- Quick checks (safe to run):
-- select * from public.v_post_stats_public order by created_at desc limit 10;
-- select * from public.comments order by created_at desc limit 10;


