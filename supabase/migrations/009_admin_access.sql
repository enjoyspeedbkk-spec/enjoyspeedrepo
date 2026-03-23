-- ============================================================
-- ADMIN ACCESS MANAGEMENT
-- Sets up enjoyspeed.bkk@gmail.com as admin
-- and provides functions for managing admin access
-- ============================================================

-- Function to grant admin role by email
create or replace function public.grant_admin_by_email(p_email text)
returns text as $$
declare
  v_user_id uuid;
begin
  -- Find the user by email in auth.users
  select id into v_user_id
  from auth.users
  where email = p_email
  limit 1;

  if v_user_id is null then
    return 'User not found. They must sign up first.';
  end if;

  -- Update their profile role to admin
  update public.profiles
  set role = 'admin', updated_at = now()
  where id = v_user_id;

  return 'Admin access granted to ' || p_email;
end;
$$ language plpgsql security definer;

-- Function to revoke admin role by email
create or replace function public.revoke_admin_by_email(p_email text)
returns text as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = p_email
  limit 1;

  if v_user_id is null then
    return 'User not found.';
  end if;

  update public.profiles
  set role = 'customer', updated_at = now()
  where id = v_user_id;

  return 'Admin access revoked for ' || p_email;
end;
$$ language plpgsql security definer;

-- Function to list all admins (for the admin management UI)
create or replace function public.list_admins()
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
) as $$
begin
  return query
  select p.id, u.email, p.full_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'admin'
  order by p.created_at;
end;
$$ language plpgsql security definer;

-- ============================================================
-- SEED: Set enjoyspeed.bkk@gmail.com as admin
-- This runs on migration — if the user has signed up, they get admin.
-- If they haven't signed up yet, the trigger below handles it.
-- ============================================================
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'enjoyspeed.bkk@gmail.com'
  limit 1;

  if v_user_id is not null then
    update public.profiles
    set role = 'admin'
    where id = v_user_id;
    raise notice 'Admin role set for enjoyspeed.bkk@gmail.com';
  else
    raise notice 'enjoyspeed.bkk@gmail.com not found yet — will be set on signup';
  end if;
end $$;

-- Auto-promote: when enjoyspeed.bkk@gmail.com signs up, make them admin
create or replace function public.auto_promote_owner()
returns trigger as $$
begin
  if new.email = 'enjoyspeed.bkk@gmail.com' then
    -- Small delay to let handle_new_user() create the profile first
    perform pg_sleep(0.1);
    update public.profiles
    set role = 'admin'
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists first to be safe
drop trigger if exists auto_promote_owner_trigger on auth.users;

create trigger auto_promote_owner_trigger
  after insert on auth.users
  for each row execute function public.auto_promote_owner();
