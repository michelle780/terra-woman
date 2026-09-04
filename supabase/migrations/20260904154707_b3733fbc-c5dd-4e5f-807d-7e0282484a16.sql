alter table public.roots_content
  add column if not exists collection text,
  add column if not exists tree_branch text,
  add column if not exists legacy_lens text,
  add column if not exists persecution_type text,
  add column if not exists region_group text;