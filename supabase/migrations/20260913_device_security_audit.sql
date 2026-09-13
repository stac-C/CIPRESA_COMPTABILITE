-- Audit des connexions et gestion des sessions de confiance.
create table if not exists public.device_login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid references public.user_devices(id) on delete set null,
  device_key text not null,
  event_type text not null default 'LOGIN' check (event_type in ('LOGIN', 'REVOKED', 'REMOTE_SIGN_OUT')),
  ip_address inet,
  country_code text,
  region text,
  city text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.user_devices add column if not exists first_seen_at timestamptz not null default now();
alter table public.user_devices add column if not exists last_login_at timestamptz;
alter table public.user_devices add column if not exists login_count integer not null default 0;
alter table public.user_devices add column if not exists last_ip_address inet;
alter table public.user_devices add column if not exists last_country_code text;
alter table public.user_devices add column if not exists last_region text;
alter table public.user_devices add column if not exists last_city text;

create index if not exists idx_device_login_events_user_created
  on public.device_login_events(user_id, created_at desc);
create index if not exists idx_device_login_events_device
  on public.device_login_events(device_id, created_at desc);

alter table public.device_login_events enable row level security;
drop policy if exists device_login_events_select_own on public.device_login_events;
create policy device_login_events_select_own on public.device_login_events
  for select to authenticated using (user_id = auth.uid());

drop policy if exists device_login_events_admin_select on public.device_login_events;
create policy device_login_events_admin_select on public.device_login_events
  for select to authenticated using (public.is_admin());

-- Les fonctions Edge utilisent la clef service_role pour inserer et maintenir ces donnees.
grant select on public.device_login_events to authenticated;
grant select, update on public.user_devices to authenticated;
