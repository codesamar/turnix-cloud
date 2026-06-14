-- App-level provider OAuth configuration (managed via dashboard)

create table public.provider_config (
  provider public.cloud_provider primary key,
  enabled boolean not null default false,
  client_id text,
  client_secret_encrypted text not null default '',
  extra jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.provider_config enable row level security;

create policy "Authenticated users can read provider config"
  on public.provider_config for select
  to authenticated
  using (true);

create policy "Authenticated users can insert provider config"
  on public.provider_config for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update provider config"
  on public.provider_config for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete provider config"
  on public.provider_config for delete
  to authenticated
  using (true);
