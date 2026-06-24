create table if not exists public.trip_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.trip_state enable row level security;

drop policy if exists "public read trip state" on public.trip_state;
create policy "public read trip state"
  on public.trip_state
  for select
  using (true);

drop policy if exists "public insert trip state" on public.trip_state;
create policy "public insert trip state"
  on public.trip_state
  for insert
  with check (id = 'bratislava');

drop policy if exists "public update trip state" on public.trip_state;
create policy "public update trip state"
  on public.trip_state
  for update
  using (id = 'bratislava')
  with check (id = 'bratislava');
