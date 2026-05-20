-- Create audit_logs table for client-side auditing via Supabase PostgREST.
-- If you are self-hosting PostgREST, you may need to reload the schema cache after applying this migration.

create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  user_id uuid null references auth.users (id) on delete set null,
  action text not null,
  table_name text null,
  record_id text null,
  old_data jsonb null,
  new_data jsonb null
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

alter table public.audit_logs enable row level security;

-- Allow authenticated users to write their own audit entries.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'audit_logs_insert_own'
  ) then
    create policy audit_logs_insert_own
      on public.audit_logs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

grant insert on table public.audit_logs to authenticated;
