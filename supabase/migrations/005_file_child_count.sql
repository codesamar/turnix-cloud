alter table public.file_metadata
  add column if not exists child_count integer;

comment on column public.file_metadata.child_count is
  'Immediate children count for folders (from provider when available).';
