create extension if not exists pgcrypto;

create table if not exists public.locations (
  id integer primary key,
  name text not null,
  building text not null,
  floor text,
  description text,
  qr_slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  courses text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen timestamptz,
  current_location_id integer references public.locations(id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  location_id integer not null references public.locations(id) on delete cascade,
  author_id uuid references public.profiles(id),
  pseudonym text not null default 'Anonymous Student',
  body text not null check (char_length(body) between 1 and 1000),
  tags text[] not null default '{}',
  course_tags text[] not null default '{}',
  upvotes integer not null default 0 check (upvotes >= 0),
  status text not null default 'public' check (status in ('public', 'pending', 'hidden')),
  term_week_when_written integer check (
    term_week_when_written is null
    or term_week_when_written between 1 and 12
  ),
  created_at timestamptz not null default now()
);

create index if not exists messages_location_created_idx
  on public.messages(location_id, created_at desc);

create index if not exists profiles_current_location_idx
  on public.profiles(current_location_id)
  where current_location_id is not null;

alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Public can read locations" on public.locations;
create policy "Public can read locations"
  on public.locations for select
  using (true);

drop policy if exists "Public can read public messages" on public.messages;
create policy "Public can read public messages"
  on public.messages for select
  using (status = 'public');

drop policy if exists "Demo clients can insert messages" on public.messages;
create policy "Demo clients can insert messages"
  on public.messages for insert
  with check (status in ('public', 'pending'));

drop policy if exists "Demo clients can read profiles" on public.profiles;
create policy "Demo clients can read profiles"
  on public.profiles for select
  using (true);
