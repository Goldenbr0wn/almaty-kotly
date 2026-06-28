create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status' and typnamespace = 'public'::regnamespace) then
    create type public.lead_status as enum ('new', 'contacted', 'scheduled', 'done', 'archived');
  end if;
end;
$$;

create table public.admin_users (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 24),
  service text not null check (service in ('Диагностика', 'Чистка', 'Ремонт', 'Обслуживание', 'Подбор котла', 'Пусконаладка')),
  boiler_model text not null default '',
  district text not null default '',
  comment text not null default '' check (char_length(comment) <= 1200),
  status public.lead_status not null default 'new',
  source text not null default 'web'
);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_email text,
  event_type text not null check (event_type in ('created', 'status_changed', 'note_added')),
  from_status public.lead_status,
  to_status public.lead_status,
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
before update on public.leads
for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and active = true
  );
$$;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "admins can read leads" on public.leads;
create policy "admins can read leads"
on public.leads for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "admins can update leads" on public.leads;
create policy "admins can update leads"
on public.leads for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "admins can read lead events" on public.lead_events;
create policy "admins can read lead events"
on public.lead_events for select
to authenticated
using (public.current_user_is_admin());

create index if not exists leads_status_created_idx on public.leads(status, created_at desc);
create index if not exists lead_events_lead_created_idx on public.lead_events(lead_id, created_at desc);
