-- Imita o que um projeto Supabase já traz pronto, para testar supabase/schema.sql num Postgres comum.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema extensions;
create schema auth;
grant usage on schema public, extensions, auth to anon, authenticated;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  pass text,
  raw_user_meta_data jsonb,
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
