alter table public.events
  add column rules_version integer not null default 1,
  add column rules_updated_at timestamptz not null default now();

create table public.participant_rules_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  reviewed_version integer not null default 1,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, participant_id),
  constraint participant_rules_review_version_check check (reviewed_version > 0)
);

insert into public.participant_rules_reviews (
  event_id,
  participant_id,
  reviewed_version
)
select participant.event_id, participant.id, event.rules_version
from public.participants participant
join public.events event on event.id = participant.event_id
on conflict (event_id, participant_id) do nothing;

create trigger set_participant_rules_reviews_updated_at
before update on public.participant_rules_reviews
for each row execute function public.set_updated_at();

create function public.increment_event_rules_version()
returns trigger
language plpgsql
as $$
begin
  if new.rules is distinct from old.rules then
    new.rules_version := old.rules_version + 1;
    new.rules_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger increment_event_rules_version
before update of rules on public.events
for each row execute function public.increment_event_rules_version();

alter table public.participant_rules_reviews enable row level security;

grant select, insert, update, delete
on table public.participant_rules_reviews
to service_role;
