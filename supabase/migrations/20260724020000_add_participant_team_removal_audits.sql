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
  ),
  constraint participant_team_removal_attested_check check (attested = true)
);

alter table public.participant_team_removal_audits enable row level security;

grant select, insert, update, delete
on table public.participant_team_removal_audits
to service_role;

create or replace function public.remove_team_member_with_audit(
  p_team_id uuid,
  p_remover_participant_id uuid,
  p_removed_participant_id uuid,
  p_reason text,
  p_explanation text,
  p_attested boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_remover_name text;
  v_removed_name text;
begin
  if p_remover_participant_id = p_removed_participant_id then
    raise exception 'Use Leave This Team to remove yourself.';
  end if;

  if p_reason not in ('did_not_show_up', 'other') then
    raise exception 'A valid removal reason is required.';
  end if;

  if length(trim(p_explanation)) < 3 then
    raise exception 'Please explain why this participant is being removed.';
  end if;

  if p_attested is not true then
    raise exception 'You must confirm that the information is true.';
  end if;

  select t.event_id, concat_ws(' ', remover.first_name, remover.last_name)
    into v_event_id, v_remover_name
  from public.teams t
  join public.team_memberships remover_membership
    on remover_membership.team_id = t.id
   and remover_membership.participant_id = p_remover_participant_id
  join public.participants remover
    on remover.id = remover_membership.participant_id
  where t.id = p_team_id;

  if v_event_id is null then
    raise exception 'You are not a current member of this team.';
  end if;

  select concat_ws(' ', removed.first_name, removed.last_name)
    into v_removed_name
  from public.team_memberships removed_membership
  join public.participants removed
    on removed.id = removed_membership.participant_id
  where removed_membership.team_id = p_team_id
    and removed_membership.participant_id = p_removed_participant_id
    and removed.event_id = v_event_id;

  if v_removed_name is null then
    raise exception 'The selected participant is not a current member of this team.';
  end if;

  insert into public.participant_team_removal_audits (
    event_id,
    team_id,
    remover_participant_id,
    removed_participant_id,
    remover_name,
    removed_name,
    reason,
    explanation,
    attested,
    attested_at
  )
  values (
    v_event_id,
    p_team_id,
    p_remover_participant_id,
    p_removed_participant_id,
    v_remover_name,
    v_removed_name,
    p_reason,
    trim(p_explanation),
    true,
    now()
  );

  delete from public.team_memberships
  where team_id = p_team_id
    and participant_id = p_removed_participant_id;

  return v_event_id;
end;
$$;

revoke all on function public.remove_team_member_with_audit(uuid, uuid, uuid, text, text, boolean)
from public;

grant execute on function public.remove_team_member_with_audit(uuid, uuid, uuid, text, text, boolean)
to service_role;
