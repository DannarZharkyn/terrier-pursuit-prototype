alter table public.teams
  add column normalized_name text,
  add column team_code text,
  add column created_by_participant_id uuid references public.participants(id) on delete cascade;

update public.teams
set
  normalized_name = lower(regexp_replace(btrim(name), '\s+', ' ', 'g')),
  team_code = left(upper(replace(id::text, '-', '')), 12)
where normalized_name is null
   or team_code is null;

alter table public.teams
  alter column normalized_name set not null,
  alter column team_code set not null;

alter table public.teams
  drop constraint if exists teams_event_id_name_key;

alter table public.teams
  add constraint teams_event_id_normalized_name_key unique (event_id, normalized_name),
  add constraint teams_event_id_team_code_key unique (event_id, team_code),
  add constraint teams_normalized_name_format_check check (
    normalized_name = lower(normalized_name)
    and length(normalized_name) > 0
  ),
  add constraint teams_team_code_format_check check (
    team_code = upper(team_code)
    and length(team_code) between 4 and 12
  ),
  add constraint teams_participant_created_creator_check check (
    assignment_method <> 'participant_created'
    or created_by_participant_id is not null
  );
