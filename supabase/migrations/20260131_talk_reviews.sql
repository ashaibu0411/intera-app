-- Talk Now: reviews/ratings for talk sessions
-- Allows participants to rate the other user after a session ends.

create extension if not exists pgcrypto;

create table if not exists public.talk_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.talk_sessions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text null,
  created_at timestamptz not null default now(),
  unique (session_id, reviewer_id)
);

create index if not exists talk_reviews_reviewee_idx on public.talk_reviews(reviewee_id, created_at desc);
create index if not exists talk_reviews_reviewer_idx on public.talk_reviews(reviewer_id, created_at desc);

alter table public.talk_reviews enable row level security;

-- Anyone authenticated can read review aggregates via the view below (not raw reviews).
-- Participants can read raw reviews for their own sessions.
drop policy if exists "talk_reviews_select_participants" on public.talk_reviews;
create policy "talk_reviews_select_participants"
on public.talk_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.talk_sessions s
    where s.id = talk_reviews.session_id
      and (s.requester_id = auth.uid() or s.provider_id = auth.uid())
  )
);

-- Insert via RPC only (no direct insert policy).

-- Aggregate stats per user (for showing ratings in UI)
create or replace view public.talk_user_stats as
select
  reviewee_id as user_id,
  count(*)::integer as review_count,
  round(avg(rating)::numeric, 2) as avg_rating
from public.talk_reviews
group by reviewee_id;

grant select on public.talk_user_stats to authenticated;

-- Submit review RPC (validates session ended, participants, and who is being reviewed)
create or replace function public.submit_talk_review(
  session_id uuid,
  rating integer,
  comment text default null
)
returns public.talk_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid;
  s record;
  other_id uuid;
  created public.talk_reviews;
begin
  caller := auth.uid();
  if caller is null then
    raise exception 'not authenticated';
  end if;
  if session_id is null then
    raise exception 'session_id is required';
  end if;
  if rating is null or rating < 1 or rating > 5 then
    raise exception 'invalid_rating';
  end if;

  select *
  into s
  from public.talk_sessions
  where id = session_id;

  if not found then
    raise exception 'session not found';
  end if;

  if caller <> s.requester_id and caller <> s.provider_id then
    raise exception 'not allowed';
  end if;

  if s.ended_at is null then
    raise exception 'session_not_ended';
  end if;

  other_id := case when caller = s.requester_id then s.provider_id else s.requester_id end;

  insert into public.talk_reviews (session_id, reviewer_id, reviewee_id, rating, comment)
  values (session_id, caller, other_id, rating, nullif(comment, ''))
  returning * into created;

  return created;
exception
  when unique_violation then
    raise exception 'already_reviewed';
end;
$$;

revoke all on function public.submit_talk_review(uuid, integer, text) from public;
grant execute on function public.submit_talk_review(uuid, integer, text) to authenticated;

