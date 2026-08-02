create table public.participant_realtime_signals (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  constraint participant_realtime_signals_kind_check check (
    kind in ('rules_updated', 'team_membership')
  )
);

create index participant_realtime_signals_event_id_idx
on public.participant_realtime_signals (event_id);

create index participant_realtime_signals_participant_id_idx
on public.participant_realtime_signals (participant_id);

alter table public.participant_realtime_signals enable row level security;

create policy "Anonymous clients can receive participant change signals"
on public.participant_realtime_signals
for select
to anon, authenticated
using (true);

grant select on table public.participant_realtime_signals to anon, authenticated;
grant select, insert, update, delete
on table public.participant_realtime_signals
to service_role;

create function public.emit_rules_realtime_signal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rules is distinct from old.rules then
    insert into public.participant_realtime_signals (event_id, participant_id, kind)
    values (new.id, null, 'rules_updated');
  end if;

  return new;
end;
$$;

create trigger emit_rules_realtime_signal
after update of rules on public.events
for each row execute function public.emit_rules_realtime_signal();

create function public.emit_team_membership_realtime_signals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_team_id uuid := coalesce(new.team_id, old.team_id);
  affected_event_id uuid;
  changed_participant_id uuid := coalesce(new.participant_id, old.participant_id);
begin
  select team.event_id
  into affected_event_id
  from public.teams team
  where team.id = affected_team_id;

  if affected_event_id is null then
    return coalesce(new, old);
  end if;

  insert into public.participant_realtime_signals (event_id, participant_id, kind)
  select affected_event_id, affected.participant_id, 'team_membership'
  from (
    select membership.participant_id
    from public.team_memberships membership
    where membership.team_id = affected_team_id
    union
    select changed_participant_id
  ) affected;

  return coalesce(new, old);
end;
$$;

create trigger emit_team_membership_realtime_signals
after insert or delete on public.team_memberships
for each row execute function public.emit_team_membership_realtime_signals();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'participant_realtime_signals'
  ) then
    alter publication supabase_realtime
    add table public.participant_realtime_signals;
  end if;
end
$$;
