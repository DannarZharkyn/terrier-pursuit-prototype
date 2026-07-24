create table public.event_invitation_emails (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending',
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, participant_id),
  constraint event_invitation_emails_status_check check (
    status in ('pending', 'sent', 'failed')
  )
);

create trigger set_event_invitation_emails_updated_at
before update on public.event_invitation_emails
for each row
execute function public.set_updated_at();

alter table public.event_invitation_emails enable row level security;

grant select, insert, update, delete
on table public.event_invitation_emails
to service_role;
