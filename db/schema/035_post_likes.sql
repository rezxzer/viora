-- File: db/schema/035_post_likes.sql
-- Post likes + RLS

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_post_likes_post on public.post_likes(post_id);
create index if not exists idx_post_likes_user on public.post_likes(user_id);

alter table public.post_likes enable row level security;

-- public can read
drop policy if exists post_likes_select_public on public.post_likes;
create policy post_likes_select_public on public.post_likes
  for select using (true);

-- only the actor can like/unlike (admin bypass not needed)
drop policy if exists post_likes_insert_self on public.post_likes;
create policy post_likes_insert_self on public.post_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists post_likes_delete_self on public.post_likes;
create policy post_likes_delete_self on public.post_likes
  for delete using (auth.uid() = user_id);


