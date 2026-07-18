grant usage on schema public to service_role;

grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.participants to service_role;
grant select, insert, update, delete on table public.event_locations to service_role;
grant select, insert, update, delete on table public.teams to service_role;
grant select, insert, update, delete on table public.team_memberships to service_role;
grant select, insert, update, delete on table public.submissions to service_role;
