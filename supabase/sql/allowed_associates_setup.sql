create extension if not exists pgcrypto;

create table if not exists public.allowed_associates (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  created_by uuid null default auth.uid()
);

create unique index if not exists allowed_associates_email_unique
  on public.allowed_associates (lower(email));

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_unique
  on public.admin_users (lower(email));

alter table public.allowed_associates enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "allowed_associates_select_authenticated" on public.allowed_associates;
create policy "allowed_associates_select_authenticated"
  on public.allowed_associates
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "allowed_associates_insert_admin" on public.allowed_associates;
create policy "allowed_associates_insert_admin"
  on public.allowed_associates
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "allowed_associates_delete_admin" on public.allowed_associates;
create policy "allowed_associates_delete_admin"
  on public.allowed_associates
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "admin_users_select_authenticated" on public.admin_users;
create policy "admin_users_select_authenticated"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "admin_users_insert_admin" on public.admin_users;
create policy "admin_users_insert_admin"
  on public.admin_users
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "admin_users_delete_admin" on public.admin_users;
create policy "admin_users_delete_admin"
  on public.admin_users
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
    )
  );
