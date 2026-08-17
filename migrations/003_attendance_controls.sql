do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'users'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%role%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.users drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.users
  add constraint users_role_allowed
  check (role in ('PERSON', 'ADMIN', 'SUPER_ADMIN', 'ATTENDANCE_MANAGER'));

create table if not exists app_settings (
  key text primary key,
  value text not null,
  description text,
  updated_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_absence_limit_number
    check (key <> 'max_absences_before_block' or value ~ '^[0-9]+$')
);

insert into app_settings (key, value, description)
values (
  'max_absences_before_block',
  '4',
  'Numero de faltas permitidas antes de bloquear nuevas inscripciones. Se bloquea cuando la persona supera este valor.'
)
on conflict (key) do nothing;

alter table public.person_profiles
  add column if not exists absence_unlocked_at timestamptz;

create index if not exists shift_registrations_person_absent_idx
  on shift_registrations (person_id, updated_at)
  where status = 'CONFIRMED' and attendance_status = 'ABSENT';

create or replace function enforce_shift_registration_rules()
returns trigger as $$
declare
  shift_status text;
  shift_capacity integer;
  confirmed_count integer;
  cancelled_count integer;
  absence_limit integer;
  absence_count integer;
  unlocked_at timestamptz;
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

    select coalesce((
      select value::int
      from app_settings
      where key = 'max_absences_before_block'
    ), 4)
      into absence_limit;

    select pp.absence_unlocked_at
      into unlocked_at
    from person_profiles pp
    where pp.user_id = new.person_id;

    select count(*)::int
      into absence_count
    from shift_registrations
    where person_id = new.person_id
      and status = 'CONFIRMED'
      and attendance_status = 'ABSENT'
      and updated_at > coalesce(unlocked_at, '-infinity'::timestamptz);

    if absence_count > absence_limit then
      raise exception 'ABSENCE_BLOCKED';
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
