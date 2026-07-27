alter table public.events
  add column disclaimer_text text not null default $disclaimer$
Terrier Pursuit — Participation Acknowledgment and Media Consent

Terrier Pursuit is a voluntary team activity that may involve walking, using public transportation, crossing streets, and visiting public locations throughout Boston. Participation involves ordinary risks associated with travel in an urban environment, including traffic, weather, uneven surfaces, crowds, and physical exertion.

Participants are responsible for making safe decisions, remaining with their team, following all applicable laws and Boston University policies, respecting people and property, and avoiding restricted, private, unsafe, or hazardous areas. Clues never require trespassing, unsafe conduct, or entering a location where photography is prohibited. The game does not provide turn-by-turn directions or continuously monitor participants. If a situation feels unsafe, participants should stop, move to a safe place, and contact the organizer. For an emergency, call 911 or the appropriate BU emergency service.

Team members will take and upload photographs as proof of completing clues. Participants must obtain permission from identifiable teammates before uploading a photograph and should avoid photographing bystanders without permission. Uploaded photographs, participant details, team information, and consent records may be stored and reviewed to administer the event, confirm results, select winners, and support event follow-up.

By accepting the media consent below, I authorize Trustees of Boston University and its representatives to use submitted photographs that include my likeness or name for Terrier Pursuit and related Boston University educational, informational, or promotional communications, including websites, social media, print, and presentations, without compensation. I understand that submitted photographs may be downloaded by the event organizer for these purposes.

Participation is voluntary. This acknowledgment is a prototype event notice and does not replace any waiver or release that Boston University Risk Management, the sponsoring school or department, or another authorized University office may require. The sponsoring office should review and approve the final wording before publishing the event.
$disclaimer$,
  add column disclaimer_locked_at timestamptz;

create table public.participant_disclaimer_consents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  activity_safety_accepted boolean not null default false,
  media_data_accepted boolean not null default false,
  disclaimer_text_snapshot text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, participant_id),
  constraint participant_disclaimer_acceptance_complete_check check (
    (
      activity_safety_accepted = false
      and media_data_accepted = false
      and accepted_at is null
      and disclaimer_text_snapshot is null
    )
    or (
      activity_safety_accepted = true
      and media_data_accepted = true
      and accepted_at is not null
      and length(trim(disclaimer_text_snapshot)) > 0
    )
  )
);

create trigger set_participant_disclaimer_consents_updated_at
before update on public.participant_disclaimer_consents
for each row execute function public.set_updated_at();

create function public.prevent_accepted_disclaimer_changes()
returns trigger
language plpgsql
as $$
begin
  if new.disclaimer_text is distinct from old.disclaimer_text
     and exists (
       select 1
       from public.participant_disclaimer_consents consent
       where consent.event_id = old.id
         and consent.accepted_at is not null
     ) then
    raise exception 'Disclaimer cannot be changed after a participant has accepted it.';
  end if;
  return new;
end;
$$;

create trigger prevent_accepted_disclaimer_changes
before update of disclaimer_text on public.events
for each row execute function public.prevent_accepted_disclaimer_changes();

create function public.lock_event_disclaimer_after_acceptance()
returns trigger
language plpgsql
as $$
begin
  if new.accepted_at is not null then
    update public.events
    set disclaimer_locked_at = coalesce(disclaimer_locked_at, new.accepted_at)
    where id = new.event_id;
  end if;
  return new;
end;
$$;

create trigger lock_event_disclaimer_after_acceptance
after insert or update of accepted_at on public.participant_disclaimer_consents
for each row execute function public.lock_event_disclaimer_after_acceptance();

alter table public.participant_disclaimer_consents enable row level security;

grant select, insert, update, delete
on table public.participant_disclaimer_consents
to service_role;
