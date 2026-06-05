-- Bakken Pulse: North Dakota oil & gas activity schema
-- Ready for ND Oil & Gas Division (or similar) ingest via ETL — no scraping in-app.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.activity_event_type as enum (
  'permit',
  'spud',
  'completion',
  'regulatory',
  'logistics'
);

create type public.alert_severity as enum ('info', 'warning', 'critical');

create type public.risk_level as enum ('low', 'moderate', 'elevated', 'critical');

-- ---------------------------------------------------------------------------
-- Operators
-- ---------------------------------------------------------------------------
create table public.operators (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  hq text,
  focus_areas text,
  permits_ytd integer not null default 0,
  rigs integer not null default 0,
  is_active boolean not null default true,
  source_system text not null default 'nd_oil_gas',
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index operators_name_idx on public.operators (name);
create index operators_is_active_idx on public.operators (is_active) where is_active = true;

-- ---------------------------------------------------------------------------
-- Counties (reference + rollups; sync from ND source)
-- ---------------------------------------------------------------------------
create table public.counties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permits_ytd integer not null default 0,
  rigs integer not null default 0,
  median_cycle_days integer,
  top_operator_name text,
  source_system text not null default 'nd_oil_gas',
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Permits
-- ---------------------------------------------------------------------------
create table public.permits (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  operator_id uuid references public.operators (id) on delete set null,
  operator_name text not null,
  well_name text not null,
  county_id uuid references public.counties (id) on delete set null,
  county_name text not null,
  permit_type text not null,
  status text not null,
  filed_at date not null,
  source_system text not null default 'nd_oil_gas',
  source_record_id text,
  source_payload jsonb,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index permits_filed_at_idx on public.permits (filed_at desc);
create index permits_county_name_idx on public.permits (county_name);
create index permits_operator_id_idx on public.permits (operator_id);
create index permits_status_idx on public.permits (status);

-- ---------------------------------------------------------------------------
-- Activity events (dashboard feed; alerts = rows with severity set)
-- ---------------------------------------------------------------------------
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  body text,
  county_name text not null,
  event_type public.activity_event_type not null,
  severity public.alert_severity,
  occurred_at timestamptz not null,
  permit_id uuid references public.permits (id) on delete set null,
  operator_id uuid references public.operators (id) on delete set null,
  source_system text not null default 'nd_oil_gas',
  source_record_id text,
  created_at timestamptz not null default now()
);

create index activity_events_occurred_at_idx on public.activity_events (occurred_at desc);
create index activity_events_alerts_idx on public.activity_events (occurred_at desc)
  where severity is not null;

-- ---------------------------------------------------------------------------
-- Risk summaries (capacity / AI readouts)
-- ---------------------------------------------------------------------------
create table public.risk_summaries (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  bullets jsonb not null default '[]'::jsonb,
  risk_level public.risk_level not null,
  generated_at timestamptz not null,
  is_current boolean not null default false,
  source_system text not null default 'system',
  created_at timestamptz not null default now()
);

create unique index risk_summaries_one_current_idx on public.risk_summaries (is_current)
  where is_current = true;

create index risk_summaries_generated_at_idx on public.risk_summaries (generated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger operators_updated_at
  before update on public.operators
  for each row execute function public.set_updated_at();

create trigger counties_updated_at
  before update on public.counties
  for each row execute function public.set_updated_at();

create trigger permits_updated_at
  before update on public.permits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security (read-only public for app; writes via service role / ETL)
-- ---------------------------------------------------------------------------
alter table public.operators enable row level security;
alter table public.counties enable row level security;
alter table public.permits enable row level security;
alter table public.activity_events enable row level security;
alter table public.risk_summaries enable row level security;

create policy "operators_select_anon"
  on public.operators for select to anon, authenticated using (true);

create policy "counties_select_anon"
  on public.counties for select to anon, authenticated using (true);

create policy "permits_select_anon"
  on public.permits for select to anon, authenticated using (true);

create policy "activity_events_select_anon"
  on public.activity_events for select to anon, authenticated using (true);

create policy "risk_summaries_select_anon"
  on public.risk_summaries for select to anon, authenticated using (true);
