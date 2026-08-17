create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password_hash text not null,
  role text not null default 'PERSON' check (role in ('PERSON', 'ADMIN', 'SUPER_ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_unique on users (lower(email));
create index if not exists users_role_idx on users (role);

create table if not exists person_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  full_name text not null,
  cedula text not null unique check (cedula ~ '^[0-9]{5,15}$'),
  phone text not null,
  birth_date date,
  address text,
  blood_type text,
  eps text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists person_profiles_cedula_idx on person_profiles (cedula);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  max_capacity integer not null check (max_capacity > 0),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'OPEN', 'FULL', 'CLOSED', 'CANCELLED', 'COMPLETED')),
  created_by uuid references users(id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists shifts_date_idx on shifts (shift_date);
create index if not exists shifts_status_idx on shifts (status);

create table if not exists shift_registrations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references users(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade,
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED', 'CANCELLED')),
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  attendance_status text not null default 'PENDING' check (attendance_status in ('PENDING', 'PRESENT', 'ABSENT', 'LATE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shift_registrations_one_active_idx
  on shift_registrations (person_id, shift_id)
  where status = 'CONFIRMED';

create index if not exists shift_registrations_shift_idx on shift_registrations (shift_id);
create index if not exists shift_registrations_person_idx on shift_registrations (person_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on audit_logs (actor_user_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists person_profiles_set_updated_at on person_profiles;
create trigger person_profiles_set_updated_at
before update on person_profiles
for each row execute function set_updated_at();

drop trigger if exists shift_registrations_set_updated_at on shift_registrations;
create trigger shift_registrations_set_updated_at
before update on shift_registrations
for each row execute function set_updated_at();

create or replace function validate_shift_update()
returns trigger as $$
declare
  confirmed_count integer;
begin
  select count(*)::int
    into confirmed_count
  from shift_registrations
  where shift_id = new.id
    and status = 'CONFIRMED';

  if new.max_capacity < confirmed_count then
    raise exception 'Shift capacity cannot be lower than confirmed registrations';
  end if;

  if new.status in ('OPEN', 'FULL') then
    if confirmed_count >= new.max_capacity then
      new.status := 'FULL';
    else
      new.status := 'OPEN';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists shifts_validate_update on shifts;
create trigger shifts_validate_update
before update on shifts
for each row execute function validate_shift_update();

create or replace function enforce_shift_registration_rules()
returns trigger as $$
declare
  shift_status text;
  shift_capacity integer;
  confirmed_count integer;
  cancelled_count integer;
begin
  if new.status = 'CONFIRMED'
     and (tg_op = 'INSERT' or old.status <> 'CONFIRMED' or old.shift_id <> new.shift_id) then
    select status, max_capacity
      into shift_status, shift_capacity
    from shifts
    where id = new.shift_id
    for update;

    if not found then
      raise exception 'Shift not found';
    end if;

    if shift_status <> 'OPEN' then
      raise exception 'Shift is not open';
    end if;

    select count(*)::int
      into cancelled_count
    from shift_registrations
    where person_id = new.person_id
      and shift_id = new.shift_id
      and status = 'CANCELLED';

    if cancelled_count >= 2 then
      raise exception 'Cancellation limit exceeded';
    end if;

    if tg_op = 'UPDATE' then
      select count(*)::int
        into confirmed_count
      from shift_registrations
      where shift_id = new.shift_id
        and status = 'CONFIRMED'
        and id <> new.id;
    else
      select count(*)::int
        into confirmed_count
      from shift_registrations
      where shift_id = new.shift_id
        and status = 'CONFIRMED';
    end if;

    if confirmed_count >= shift_capacity then
      raise exception 'Shift capacity exceeded';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists shift_registrations_enforce_rules on shift_registrations;
create trigger shift_registrations_enforce_rules
before insert or update on shift_registrations
for each row execute function enforce_shift_registration_rules();

create or replace function sync_shift_status_after_registration()
returns trigger as $$
declare
  affected_shift uuid;
  shift_status text;
  shift_capacity integer;
  confirmed_count integer;
begin
  affected_shift := coalesce(new.shift_id, old.shift_id);

  select status, max_capacity
    into shift_status, shift_capacity
  from shifts
  where id = affected_shift
  for update;

  if not found then
    return coalesce(new, old);
  end if;

  select count(*)::int
    into confirmed_count
  from shift_registrations
  where shift_id = affected_shift
    and status = 'CONFIRMED';

  if shift_status in ('OPEN', 'FULL') then
    update shifts
       set status = case
         when confirmed_count >= shift_capacity then 'FULL'
         else 'OPEN'
       end,
       updated_at = now()
     where id = affected_shift;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists shift_registrations_sync_shift_status on shift_registrations;
create trigger shift_registrations_sync_shift_status
after insert or update or delete on shift_registrations
for each row execute function sync_shift_status_after_registration();
