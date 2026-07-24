create table public.participant_team_removal_audits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  remover_participant_id uuid references public.participants(id) on delete set null,
  removed_participant_id uuid references public.participants(id) on delete set null,
  remover_name text not null,
  removed_name text not null,
  reason text not null,
  explanation text not null,
  attested boolean not null,
  attested_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint participant_team_removal_reason_check check (
    reason in ('did_not_show_up', 'other')
  )
);

alter table public.participant_team_removal_audits enable row level security;

grant select, insert, update, delete
on table public.participant_team_removal_audits
to service_role;
