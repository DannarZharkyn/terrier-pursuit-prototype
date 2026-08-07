create table if not exists public.platform_templates (
  template_key text primary key,
  rules text not null,
  disclaimer text not null,
  email_subject text not null,
  email_body text not null,
  participant_instructions text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_templates_key_check check (template_key = 'event_defaults')
);

create trigger set_platform_templates_updated_at
before update on public.platform_templates
for each row
execute function public.set_updated_at();

alter table public.platform_templates enable row level security;

grant select, insert, update on table public.platform_templates to service_role;
