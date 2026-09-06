alter table public.participants
  add column if not exists registration_role text;

alter table public.participants
  drop constraint if exists participants_registration_role_check;

alter table public.participants
  add constraint participants_registration_role_check check (
    registration_role is null
    or registration_role in ('leader', 'participant')
  );

comment on column public.participants.registration_role is
  'Optional role supplied in the organizer participant import: leader or participant.';
