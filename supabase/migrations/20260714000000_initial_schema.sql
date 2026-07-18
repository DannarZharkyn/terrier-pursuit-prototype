create extension if not exists pgcrypto;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game_code text unique,
  status text not null default 'draft',
  registration_deadline timestamptz,
  starts_at timestamptz,
  submission_deadline timestamptz,
  data_deletion_scheduled_at timestamptz,
  data_deleted_at timestamptz,
  rules text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_status_check check (
    status in ('draft', 'published', 'closed', 'archived')
  ),
  constraint events_game_code_format_check check (
    game_code is null
    or (
      game_code = upper(game_code)
      and length(game_code) between 4 and 12
    )
  )
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  normalized_first_name text not null,
  normalized_last_name text not null,
  normalized_email text not null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, normalized_email),
  constraint participants_email_basic_format_check check (
    normalized_email = lower(normalized_email)
    and position('@' in normalized_email) > 1
    and position('.' in split_part(normalized_email, '@', 2)) > 1
  )
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  assignment_method text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name),
  constraint teams_assignment_method_check check (
    assignment_method in ('manual', 'automatic', 'participant_created')
  )
);

create table public.team_memberships (
  team_id uuid not null references public.teams(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, participant_id)
);

create table public.event_locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  position integer not null,
  landmark text not null,
  normalized_landmark text not null,
  location_url text not null,
  clue text not null,
  campus_population text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, position),
  unique (event_id, normalized_landmark),
  constraint event_locations_position_positive_check check (position > 0),
  constraint event_locations_location_url_check check (
    location_url like 'https://%'
  )
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  event_location_id uuid not null references public.event_locations(id) on delete cascade,
  submitted_by_participant_id uuid references public.participants(id) on delete set null,
  photo_storage_path text,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_notes text,
  unique (team_id, event_location_id),
  constraint submissions_status_check check (
    status in ('pending', 'approved', 'rejected')
  )
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create trigger set_participants_updated_at
before update on public.participants
for each row
execute function public.set_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create trigger set_event_locations_updated_at
before update on public.event_locations
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.event_locations enable row level security;
alter table public.submissions enable row level security;
