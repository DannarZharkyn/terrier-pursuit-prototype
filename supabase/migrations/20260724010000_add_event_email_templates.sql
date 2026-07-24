alter table public.events
  add column if not exists email_subject text,
  add column if not exists email_body text;
