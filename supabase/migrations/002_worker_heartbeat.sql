alter table public.platform_settings
  add column if not exists value jsonb not null default '{}'::jsonb;

create or replace function public.set_platform_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_platform_settings_updated_at();

comment on column public.platform_settings.value is
  'Generic JSON payload for platform settings metadata, including audit worker heartbeat rows keyed as audit_worker:<workerId>.';
