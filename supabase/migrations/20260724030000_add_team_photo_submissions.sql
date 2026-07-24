create table public.team_hunt_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  submitted_by_participant_id uuid references public.participants(id) on delete set null,
  status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_notes text,
  unique (team_id),
  constraint team_hunt_submissions_status_check check (
    status in ('submitted', 'approved', 'rejected')
  )
);

create table public.team_submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.team_hunt_submissions(id) on delete cascade,
  uploaded_by_participant_id uuid references public.participants(id) on delete set null,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (submission_id, position),
  constraint team_submission_photos_size_check check (file_size_bytes > 0),
  constraint team_submission_photos_position_check check (position > 0)
);

alter table public.team_hunt_submissions enable row level security;
alter table public.team_submission_photos enable row level security;

grant select, insert, update, delete
on table public.team_hunt_submissions, public.team_submission_photos
to service_role;
