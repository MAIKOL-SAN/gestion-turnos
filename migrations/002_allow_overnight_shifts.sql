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
    and t.relname = 'shifts'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%end_time%'
    and pg_get_constraintdef(c.oid) ilike '%start_time%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.shifts drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.shifts
  add constraint shifts_start_end_different
  check (start_time <> end_time);
