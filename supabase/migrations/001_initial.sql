-- TurnixCloud initial schema

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'en',
  theme text not null default 'system',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.allocation_config (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cloud accounts
create type public.cloud_provider as enum (
  'google_drive',
  'onedrive',
  'dropbox',
  'yandex',
  'mega',
  'pcloud',
  's3'
);

create type public.account_status as enum ('active', 'error', 'disconnected');

create table public.cloud_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider public.cloud_provider not null,
  label text not null default '',
  email text,
  quota_used bigint not null default 0,
  quota_total bigint not null default 0,
  credentials_encrypted text not null default '',
  status public.account_status not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider, email)
);

alter table public.cloud_accounts enable row level security;

create policy "Users can manage own cloud accounts"
  on public.cloud_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index cloud_accounts_user_id_idx on public.cloud_accounts (user_id);

-- File metadata mirror
create table public.file_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.cloud_accounts (id) on delete cascade,
  provider_file_id text not null,
  name text not null,
  path text not null default '/',
  mime_type text,
  size bigint not null default 0,
  is_folder boolean not null default false,
  is_starred boolean not null default false,
  is_shared boolean not null default false,
  parent_id uuid references public.file_metadata (id) on delete set null,
  modified_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (account_id, provider_file_id)
);

alter table public.file_metadata enable row level security;

create policy "Users can manage own file metadata"
  on public.file_metadata for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index file_metadata_user_id_idx on public.file_metadata (user_id);
create index file_metadata_account_id_idx on public.file_metadata (account_id);
create index file_metadata_path_idx on public.file_metadata (user_id, path);
create index file_metadata_starred_idx on public.file_metadata (user_id, is_starred) where is_starred = true;
create index file_metadata_shared_idx on public.file_metadata (user_id, is_shared) where is_shared = true;
create index file_metadata_modified_idx on public.file_metadata (user_id, modified_at desc);

-- Upload sessions
create type public.upload_status as enum ('pending', 'uploading', 'completed', 'failed');

create table public.upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.cloud_accounts (id) on delete cascade,
  filename text not null,
  size bigint not null default 0,
  status public.upload_status not null default 'pending',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.upload_sessions enable row level security;

create policy "Users can manage own upload sessions"
  on public.upload_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index upload_sessions_user_id_idx on public.upload_sessions (user_id);

-- Allocation config
create type public.allocation_strategy as enum (
  'round_robin',
  'weighted_round_robin',
  'least_used',
  'most_free',
  'manual'
);

create table public.allocation_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  strategy public.allocation_strategy not null default 'round_robin',
  weights jsonb not null default '{}',
  manual_order jsonb not null default '[]',
  rotation_index integer not null default 0
);

alter table public.allocation_config enable row level security;

create policy "Users can manage own allocation config"
  on public.allocation_config for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable Realtime for upload progress
alter publication supabase_realtime add table public.upload_sessions;
