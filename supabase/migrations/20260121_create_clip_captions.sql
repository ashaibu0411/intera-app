-- Captions for Clips (timed segments + optional translations)

create table if not exists public.clip_captions (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  language text not null,
  transcript text not null,
  segments jsonb not null default '[]'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clip_id, language)
);

create index if not exists clip_captions_clip_id_idx on public.clip_captions (clip_id);
create index if not exists clip_captions_language_idx on public.clip_captions (language);

alter table public.clip_captions enable row level security;

-- Public can read captions (works for guests too)
drop policy if exists "clip_captions_read_public" on public.clip_captions;
create policy "clip_captions_read_public"
on public.clip_captions
for select
using (true);

-- Only authenticated users can save captions they generated
drop policy if exists "clip_captions_insert_own" on public.clip_captions;
create policy "clip_captions_insert_own"
on public.clip_captions
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "clip_captions_update_own" on public.clip_captions;
create policy "clip_captions_update_own"
on public.clip_captions
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

-- Keep updated_at current
create or replace function public.touch_clip_captions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_clip_captions_updated_at on public.clip_captions;
create trigger trg_touch_clip_captions_updated_at
before update on public.clip_captions
for each row
execute procedure public.touch_clip_captions_updated_at();

