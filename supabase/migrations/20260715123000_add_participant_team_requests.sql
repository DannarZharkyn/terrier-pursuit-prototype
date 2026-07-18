create table if not exists public.participant_team_requests (
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  requested_at timestamptz not null default now(),
  primary key (event_id, participant_id)
);

alter table public.participant_team_requests enable row level security;

grant select, insert, update, delete on table public.participant_team_requests to service_role;
