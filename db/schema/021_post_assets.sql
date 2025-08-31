-- Post assets table (images/videos) + RLS

create table if not exists public.post_assets (
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_assets_post on public.post_assets(post_id);

alter table public.post_assets enable row level security;

drop policy if exists post_assets_select_public on public.post_assets;
create policy post_assets_select_public on public.post_assets
  for select using (true);

drop policy if exists post_assets_insert_author on public.post_assets;
create policy post_assets_insert_author on public.post_assets
  for insert with check (
    exists (
      select 1 from public.posts p where p.id = post_id and (auth.uid() = p.author_id or public.is_admin())
    )
  );

drop policy if exists post_assets_delete_author on public.post_assets;
create policy post_assets_delete_author on public.post_assets
  for delete using (
    exists (
      select 1 from public.posts p where p.id = post_id and (auth.uid() = p.author_id or public.is_admin())
    )
  );

-- post_assets table + RLS (idempotent)

-- Requirements:
-- - Store uploaded media (images/videos) per post
-- - Enforce author-only writes via RLS

CREATE TABLE IF NOT EXISTS public.post_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_assets_post_id ON public.post_assets(post_id);
CREATE INDEX IF NOT EXISTS idx_post_assets_mime ON public.post_assets(mime_type);

ALTER TABLE public.post_assets ENABLE ROW LEVEL SECURITY;

-- Public read (media are public URLs)
DROP POLICY IF EXISTS post_assets_select_all ON public.post_assets;
CREATE POLICY post_assets_select_all ON public.post_assets
  FOR SELECT USING (true);

-- Author-only insert/update/delete
DROP POLICY IF EXISTS post_assets_insert_own ON public.post_assets;
CREATE POLICY post_assets_insert_own ON public.post_assets
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS post_assets_update_own ON public.post_assets;
CREATE POLICY post_assets_update_own ON public.post_assets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
  ));

DROP POLICY IF EXISTS post_assets_delete_own ON public.post_assets;
CREATE POLICY post_assets_delete_own ON public.post_assets
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
  ));


