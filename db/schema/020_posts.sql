-- Posts base table + RLS

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

create or replace function public.tg_posts_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='tg_posts_touch') then
    create trigger tg_posts_touch
      before update on public.posts
      for each row execute function public.tg_posts_touch_updated_at();
  end if;
end$$;

alter table public.posts enable row level security;

-- Public can read posts
drop policy if exists posts_select_public on public.posts;
create policy posts_select_public on public.posts
  for select using (true);

-- Only author can insert/update/delete own posts; admin bypass
drop policy if exists posts_insert_self on public.posts;
create policy posts_insert_self on public.posts
  for insert with check (auth.uid() = author_id);

drop policy if exists posts_update_self on public.posts;
create policy posts_update_self on public.posts
  for update using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists posts_delete_self on public.posts;
create policy posts_delete_self on public.posts
  for delete using (auth.uid() = author_id or public.is_admin());

-- Posts domain: posts, post_likes, comments (idempotent)

-- Helpful for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- posts
-- =====================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- update trigger
DROP TRIGGER IF EXISTS tr_posts_updated_at ON public.posts;
CREATE TRIGGER tr_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS posts_public_read ON public.posts;
CREATE POLICY posts_public_read ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS posts_update_own ON public.posts;
CREATE POLICY posts_update_own ON public.posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS posts_delete_own ON public.posts;
CREATE POLICY posts_delete_own ON public.posts FOR DELETE USING (auth.uid() = author_id);


-- =====================
-- post_likes
-- =====================
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS post_likes_select_all ON public.post_likes;
CREATE POLICY post_likes_select_all ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS post_likes_insert_own ON public.post_likes;
CREATE POLICY post_likes_insert_own ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS post_likes_delete_own ON public.post_likes;
CREATE POLICY post_likes_delete_own ON public.post_likes FOR DELETE USING (auth.uid() = user_id);


-- =====================
-- comments
-- =====================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_comments_updated_at ON public.comments;
CREATE TRIGGER tr_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_created_at ON public.comments(author_id, created_at DESC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_public_read ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS comments_insert_own ON public.comments;
CREATE POLICY comments_insert_own ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_update_own ON public.comments;
CREATE POLICY comments_update_own ON public.comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_delete_own ON public.comments FOR DELETE USING (auth.uid() = author_id);


