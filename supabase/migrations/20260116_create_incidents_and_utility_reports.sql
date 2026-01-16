-- Incidents + Utility Reports (global, location-aware: city + optional neighborhood)

-- INCIDENTS: safety alerts, SOS, emergency requests, etc.
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,

  -- Types: 'sos', 'medical', 'fire', 'theft', 'missing', 'housing', 'transport', 'financial', 'other'
  type text not null,
  title text not null,
  description text not null,
  image text null,

  -- Location
  country text not null,
  admin_area text null,
  city text not null,
  neighborhood text null,
  location_label text not null, -- e.g. "Aurora, CO · Southshore"
  lat double precision null,
  lng double precision null,

  -- Reach: 'neighborhood' | 'city' | 'global'
  scope text not null default 'city',

  -- Status: 'active' | 'resolved'
  status text not null default 'active',

  created_at timestamptz not null default now()
);

create index if not exists incidents_created_at_idx on public.incidents (created_at desc);
create index if not exists incidents_city_idx on public.incidents (city);
create index if not exists incidents_neighborhood_idx on public.incidents (neighborhood);
create index if not exists incidents_scope_idx on public.incidents (scope);
create index if not exists incidents_status_idx on public.incidents (status);

alter table public.incidents enable row level security;

drop policy if exists incidents_select_all on public.incidents;
create policy incidents_select_all
  on public.incidents
  for select
  to authenticated
  using (true);

drop policy if exists incidents_insert_own on public.incidents;
create policy incidents_insert_own
  on public.incidents
  for insert
  to authenticated
  with check (auth.uid() = creator_id);

drop policy if exists incidents_update_own on public.incidents;
create policy incidents_update_own
  on public.incidents
  for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- INCIDENT SIGNALS: "me too", "helping", "resolved"
create table if not exists public.incident_signals (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- 'me_too' | 'helping' | 'resolved'
  kind text not null,
  created_at timestamptz not null default now(),
  unique (incident_id, user_id, kind)
);

create index if not exists incident_signals_incident_idx on public.incident_signals (incident_id);

alter table public.incident_signals enable row level security;

drop policy if exists incident_signals_select_all on public.incident_signals;
create policy incident_signals_select_all
  on public.incident_signals
  for select
  to authenticated
  using (true);

drop policy if exists incident_signals_insert_own on public.incident_signals;
create policy incident_signals_insert_own
  on public.incident_signals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists incident_signals_delete_own on public.incident_signals;
create policy incident_signals_delete_own
  on public.incident_signals
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- UTILITY REPORTS: power/water/internet status by area (crowdsourced)
create table if not exists public.utility_reports (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,

  -- 'power' | 'water' | 'internet' | 'road'
  utility text not null,
  -- 'outage' | 'restored' | 'degraded'
  state text not null,
  note text null,

  -- Location
  country text not null,
  admin_area text null,
  city text not null,
  neighborhood text null,
  location_label text not null,
  lat double precision null,
  lng double precision null,

  -- Reach: 'neighborhood' | 'city' | 'global'
  scope text not null default 'city',

  created_at timestamptz not null default now()
);

create index if not exists utility_reports_created_at_idx on public.utility_reports (created_at desc);
create index if not exists utility_reports_city_idx on public.utility_reports (city);
create index if not exists utility_reports_neighborhood_idx on public.utility_reports (neighborhood);
create index if not exists utility_reports_utility_idx on public.utility_reports (utility);
create index if not exists utility_reports_state_idx on public.utility_reports (state);

alter table public.utility_reports enable row level security;

drop policy if exists utility_reports_select_all on public.utility_reports;
create policy utility_reports_select_all
  on public.utility_reports
  for select
  to authenticated
  using (true);

drop policy if exists utility_reports_insert_own on public.utility_reports;
create policy utility_reports_insert_own
  on public.utility_reports
  for insert
  to authenticated
  with check (auth.uid() = creator_id);

