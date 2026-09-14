alter table public.participants
  add column if not exists is_team_contact boolean not null default false;

comment on column public.participants.is_team_contact is
  'True when an organizer designates this participant to coordinate a team during automatic assignment.';
