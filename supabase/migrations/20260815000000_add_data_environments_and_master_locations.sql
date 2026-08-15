alter table public.events
  add column data_environment text not null default 'live';

alter table public.events
  add constraint events_data_environment_check
  check (data_environment in ('live', 'development'));

create index events_data_environment_created_at_idx
on public.events (data_environment, created_at desc);

create table public.master_locations (
  id uuid primary key default gen_random_uuid(),
  landmark text not null,
  normalized_landmark text not null unique,
  location_url text not null,
  clue text not null,
  campus_population text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_locations_url_check check (location_url like 'https://%')
);

insert into public.master_locations (
  landmark,
  normalized_landmark,
  location_url,
  clue,
  campus_population
)
select distinct on (location.normalized_landmark)
  location.landmark,
  location.normalized_landmark,
  location.location_url,
  location.clue,
  location.campus_population
from public.event_locations location
order by location.normalized_landmark, location.updated_at desc
on conflict (normalized_landmark) do nothing;

create trigger set_master_locations_updated_at
before update on public.master_locations
for each row execute function public.set_updated_at();

alter table public.master_locations enable row level security;

grant select, insert, update, delete
on table public.master_locations
to service_role;

create or replace function public.replace_event_locations(
  target_event_id uuid,
  next_locations jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.events
    where id = target_event_id and starts_at > now()
  ) then
    raise exception 'Locations can only be changed before the game starts.';
  end if;

  if jsonb_array_length(next_locations) = 0 then
    raise exception 'At least one location is required.';
  end if;

  delete from public.event_locations where event_id = target_event_id;

  insert into public.event_locations (
    event_id, position, landmark, normalized_landmark,
    location_url, clue, campus_population
  )
  select
    target_event_id,
    row_number() over (),
    item->>'landmark',
    lower(item->>'landmark'),
    item->>'location_url',
    item->>'clue',
    item->>'campus_population'
  from jsonb_array_elements(next_locations) item;
end;
$$;

revoke all on function public.replace_event_locations(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_event_locations(uuid, jsonb) to service_role;
