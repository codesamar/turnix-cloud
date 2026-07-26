-- Store last account error for clearer UI (e.g. token_expired)
alter table public.cloud_accounts
  add column if not exists error_message text;
