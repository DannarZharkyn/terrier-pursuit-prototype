create or replace function public.reset_event_teams(
  target_event_id uuid,
  target_environment text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed_members integer;
begin
  if not exists (
    select 1
    from public.events
    where id = target_event_id
      and data_environment = target_environment
      and starts_at > now()
  ) then
    raise exception 'Teams can only be reset before the game starts.';
  end if;

  select count(*)::integer
  into removed_members
  from public.team_memberships membership
  join public.teams team on team.id = membership.team_id
  where team.event_id = target_event_id;

  delete from public.participant_team_requests
  where event_id = target_event_id;

  delete from public.teams
  where event_id = target_event_id;

  return removed_members;
end;
$$;

revoke all on function public.reset_event_teams(uuid, text) from public, anon, authenticated;
grant execute on function public.reset_event_teams(uuid, text) to service_role;
