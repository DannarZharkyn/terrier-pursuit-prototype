alter table public.team_hunt_submissions
  alter column submitted_at drop not null;

alter table public.team_hunt_submissions
  drop constraint team_hunt_submissions_status_check;

alter table public.team_hunt_submissions
  add constraint team_hunt_submissions_status_check check (
    status in ('draft', 'submitted', 'approved', 'rejected')
  );

alter table public.team_submission_photos
  add column event_location_id uuid references public.event_locations(id) on delete cascade;

create unique index team_submission_photos_submission_location_unique
  on public.team_submission_photos (submission_id, event_location_id)
  where event_location_id is not null;

