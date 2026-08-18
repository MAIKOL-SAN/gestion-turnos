import "server-only";
import { query } from "@/lib/db";
import type {
  AttendanceStatus,
  PersonProfile,
  RegistrationRow,
  Role,
  ShiftSummary,
} from "@/lib/types";

const COLOMBIA_NOW_SQL = "timezone('America/Bogota', now())";
const COLOMBIA_TODAY_SQL = `${COLOMBIA_NOW_SQL}::date`;
const SHIFT_START_SQL = "(s.shift_date + s.start_time)";

export async function getPersonProfile(userId: string) {
  const result = await query<PersonProfile>(
    `select *
     from person_profiles
     where user_id = $1
     limit 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function getShiftSummaries(options?: {
  personId?: string;
  status?: string;
  date?: string;
  search?: string;
  onlyOpenFuture?: boolean;
  limit?: number;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.status) {
    params.push(options.status);
    conditions.push(`s.status = $${params.length}`);
  }

  if (options?.date) {
    params.push(options.date);
    conditions.push(`s.shift_date = $${params.length}`);
  }

  if (options?.search) {
    params.push(`%${options.search}%`);
    conditions.push(`(s.name ilike $${params.length} or s.description ilike $${params.length})`);
  }

  if (options?.onlyOpenFuture) {
    conditions.push(`${SHIFT_START_SQL} > ${COLOMBIA_NOW_SQL}`);
    conditions.push(`s.status in ('OPEN', 'FULL')`);
  }

  const personId = options?.personId ?? null;
  params.push(personId);
  const personParam = `$${params.length}`;
  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
  const limit = options?.limit ? `limit ${Number(options.limit)}` : "";

  const result = await query<ShiftSummary>(
    `select
       s.id,
       s.name,
       s.description,
       s.shift_date::text,
       s.start_time::text,
       s.end_time::text,
       s.max_capacity,
       s.status,
       s.created_at::text,
       s.created_by,
       u.name as created_by_name,
       count(sr.id) filter (where sr.status = 'CONFIRMED')::int as registered_count,
       greatest(s.max_capacity - count(sr.id) filter (where sr.status = 'CONFIRMED'), 0)::int as available_count,
       mine.id as my_registration_id
     from shifts s
     left join users u on u.id = s.created_by
     left join shift_registrations sr on sr.shift_id = s.id
     left join shift_registrations mine
       on mine.shift_id = s.id
      and mine.person_id = ${personParam}
      and mine.status = 'CONFIRMED'
     ${where}
     group by s.id, u.name, mine.id
     order by s.shift_date asc, s.start_time asc
     ${limit}`,
    params,
  );

  return result.rows;
}

export async function getShiftById(id: string, personId?: string) {
  const shifts = await getShiftSummaries({ personId, limit: 1 });
  return shifts.find((shift) => shift.id === id) ?? (await getShiftByIdDirect(id, personId));
}

export async function getShiftByIdDirect(id: string, personId?: string) {
  const params: unknown[] = [id, personId ?? null];
  const result = await query<ShiftSummary>(
    `select
       s.id,
       s.name,
       s.description,
       s.shift_date::text,
       s.start_time::text,
       s.end_time::text,
       s.max_capacity,
       s.status,
       s.created_at::text,
       s.created_by,
       u.name as created_by_name,
       count(sr.id) filter (where sr.status = 'CONFIRMED')::int as registered_count,
       greatest(s.max_capacity - count(sr.id) filter (where sr.status = 'CONFIRMED'), 0)::int as available_count,
       mine.id as my_registration_id
     from shifts s
     left join users u on u.id = s.created_by
     left join shift_registrations sr on sr.shift_id = s.id
     left join shift_registrations mine
       on mine.shift_id = s.id
      and mine.person_id = $2
      and mine.status = 'CONFIRMED'
     where s.id = $1
     group by s.id, u.name, mine.id
     limit 1`,
    params,
  );

  return result.rows[0] ?? null;
}

export async function getShiftRegistrations(shiftId: string) {
  const result = await query<RegistrationRow>(
    `with settings as (
       select coalesce((
         select value::int
         from app_settings
         where key = 'max_absences_before_block'
       ), 4) as absence_limit
     )
     select
       sr.id,
       sr.person_id,
       sr.shift_id,
       sr.status,
       sr.attendance_status,
       sr.registered_at::text,
       sr.cancelled_at::text,
       u.name as person_name,
       u.email,
       pp.cedula,
       pp.phone,
       pp.absence_unlocked_at::text,
       absences.absence_count,
       settings.absence_limit,
       (absences.absence_count > settings.absence_limit) as registration_blocked
     from shift_registrations sr
     join users u on u.id = sr.person_id
     left join person_profiles pp on pp.user_id = u.id
     cross join settings
     left join lateral (
       select count(*)::int as absence_count
       from shift_registrations absent
       where absent.person_id = sr.person_id
         and absent.status = 'CONFIRMED'
         and absent.attendance_status = 'ABSENT'
         and absent.updated_at > coalesce(pp.absence_unlocked_at, '-infinity'::timestamptz)
     ) absences on true
     where sr.shift_id = $1
     order by sr.registered_at asc`,
    [shiftId],
  );

  return result.rows;
}

export async function getUserRegistrations(userId: string) {
  const result = await query<
    ShiftSummary & {
      registration_id: string;
      registration_status: string;
      attendance_status: AttendanceStatus;
      registered_at: string;
      cancelled_at: string | null;
    }
  >(
    `select
       s.id,
       s.name,
       s.description,
       s.shift_date::text,
       s.start_time::text,
       s.end_time::text,
       s.max_capacity,
       s.status,
       s.created_at::text,
       s.created_by,
       u.name as created_by_name,
       sr.id as registration_id,
       sr.status as registration_status,
       sr.attendance_status,
       sr.registered_at::text,
       sr.cancelled_at::text,
       count(active.id) filter (where active.status = 'CONFIRMED')::int as registered_count,
       greatest(s.max_capacity - count(active.id) filter (where active.status = 'CONFIRMED'), 0)::int as available_count,
       sr.id as my_registration_id
     from shift_registrations sr
     join shifts s on s.id = sr.shift_id
     left join users u on u.id = s.created_by
     left join shift_registrations active on active.shift_id = s.id
     where sr.person_id = $1
     group by s.id, u.name, sr.id
     order by s.shift_date desc, s.start_time desc`,
    [userId],
  );

  return result.rows;
}

export async function getRegistrationBlock(userId: string) {
  const result = await query<{
    absence_count: number;
    absence_limit: number;
    absence_unlocked_at: string | null;
    registration_blocked: boolean;
  }>(
    `with settings as (
       select coalesce((
         select value::int
         from app_settings
         where key = 'max_absences_before_block'
       ), 4) as absence_limit
     )
     select
       pp.absence_unlocked_at::text,
       absences.absence_count,
       settings.absence_limit,
       (absences.absence_count > settings.absence_limit) as registration_blocked
     from users u
     left join person_profiles pp on pp.user_id = u.id
     cross join settings
     left join lateral (
       select count(*)::int as absence_count
       from shift_registrations sr
       where sr.person_id = u.id
         and sr.status = 'CONFIRMED'
         and sr.attendance_status = 'ABSENT'
         and sr.updated_at > coalesce(pp.absence_unlocked_at, '-infinity'::timestamptz)
     ) absences on true
     where u.id = $1 and u.role = 'PERSON'
     limit 1`,
    [userId],
  );

  return (
    result.rows[0] ?? {
      absence_count: 0,
      absence_limit: 4,
      absence_unlocked_at: null,
      registration_blocked: false,
    }
  );
}

export async function getAdminMetrics() {
  const result = await query<{
    people_count: number;
    today_count: number;
    open_count: number;
    full_count: number;
    cancelled_count: number;
  }>(
    `select
      (select count(*)::int from users where role = 'PERSON') as people_count,
      (select count(*)::int from shifts where shift_date = ${COLOMBIA_TODAY_SQL} and status <> 'CANCELLED') as today_count,
      (select count(*)::int from shifts where status = 'OPEN') as open_count,
      (select count(*)::int from shifts where status = 'FULL') as full_count,
      (select count(*)::int from shifts where status = 'CANCELLED') as cancelled_count`,
  );

  return result.rows[0];
}

export async function getPeople() {
  const result = await query<{
    id: string;
    name: string;
    email: string;
    status: string;
    cedula: string | null;
    phone: string | null;
    created_at: string;
    absence_count: number;
    absence_limit: number;
    absence_unlocked_at: string | null;
    registration_blocked: boolean;
  }>(
    `with settings as (
       select coalesce((
         select value::int
         from app_settings
         where key = 'max_absences_before_block'
       ), 4) as absence_limit
     )
     select
       u.id,
       u.name,
       u.email,
       u.status,
       pp.cedula,
       pp.phone,
       u.created_at::text,
       pp.absence_unlocked_at::text,
       absences.absence_count,
       settings.absence_limit,
       (absences.absence_count > settings.absence_limit) as registration_blocked
     from users u
     left join person_profiles pp on pp.user_id = u.id
     cross join settings
     left join lateral (
       select count(*)::int as absence_count
       from shift_registrations sr
       where sr.person_id = u.id
         and sr.status = 'CONFIRMED'
         and sr.attendance_status = 'ABSENT'
         and sr.updated_at > coalesce(pp.absence_unlocked_at, '-infinity'::timestamptz)
     ) absences on true
     where u.role = 'PERSON'
     order by u.created_at desc`,
  );

  return result.rows;
}

export async function getPersonForAdmin(id: string) {
  const result = await query<{
    id: string;
    name: string;
    email: string;
    status: string;
    profile_id: string | null;
    full_name: string | null;
    cedula: string | null;
    phone: string | null;
    birth_date: string | null;
    address: string | null;
    blood_type: string | null;
    eps: string | null;
    absence_count: number;
    absence_limit: number;
    absence_unlocked_at: string | null;
    registration_blocked: boolean;
  }>(
    `with settings as (
       select coalesce((
         select value::int
         from app_settings
         where key = 'max_absences_before_block'
       ), 4) as absence_limit
     )
     select
       u.id,
       u.name,
       u.email,
       u.status,
       pp.id as profile_id,
       pp.full_name,
       pp.cedula,
       pp.phone,
       pp.birth_date::text,
       pp.address,
       pp.blood_type,
       pp.eps,
       pp.absence_unlocked_at::text,
       absences.absence_count,
       settings.absence_limit,
       (absences.absence_count > settings.absence_limit) as registration_blocked
     from users u
     left join person_profiles pp on pp.user_id = u.id
     cross join settings
     left join lateral (
       select count(*)::int as absence_count
       from shift_registrations sr
       where sr.person_id = u.id
         and sr.status = 'CONFIRMED'
         and sr.attendance_status = 'ABSENT'
         and sr.updated_at > coalesce(pp.absence_unlocked_at, '-infinity'::timestamptz)
     ) absences on true
     where u.id = $1 and u.role = 'PERSON'
     limit 1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function getAdministrators() {
  const result = await query<{
    id: string;
    name: string;
    email: string;
    role: Role;
    status: string;
    created_at: string;
  }>(
    `select id, name, email, role, status, created_at::text
     from users
     where role in ('ADMIN', 'SUPER_ADMIN', 'ATTENDANCE_MANAGER')
     order by created_at desc`,
  );

  return result.rows;
}

export async function getAttendanceLimit() {
  const result = await query<{ absence_limit: number }>(
    `select coalesce((
       select value::int
       from app_settings
       where key = 'max_absences_before_block'
     ), 4) as absence_limit`,
  );

  return result.rows[0]?.absence_limit ?? 4;
}

export async function getAttendanceShifts() {
  const result = await query<ShiftSummary>(
    `select
       s.id,
       s.name,
       s.description,
       s.shift_date::text,
       s.start_time::text,
       s.end_time::text,
       s.max_capacity,
       s.status,
       s.created_at::text,
       s.created_by,
       u.name as created_by_name,
       count(sr.id) filter (where sr.status = 'CONFIRMED')::int as registered_count,
       greatest(s.max_capacity - count(sr.id) filter (where sr.status = 'CONFIRMED'), 0)::int as available_count,
       null::uuid as my_registration_id
     from shifts s
     left join users u on u.id = s.created_by
     left join shift_registrations sr on sr.shift_id = s.id
     where s.shift_date between ${COLOMBIA_TODAY_SQL} - interval '7 days' and ${COLOMBIA_TODAY_SQL} + interval '14 days'
       and s.status <> 'CANCELLED'
     group by s.id, u.name
     order by s.shift_date asc, s.start_time asc`,
  );

  return result.rows;
}

export async function getBlockedPeople() {
  const result = await query<{
    id: string;
    name: string;
    email: string;
    status: string;
    cedula: string | null;
    phone: string | null;
    absence_count: number;
    absence_limit: number;
    absence_unlocked_at: string | null;
    registration_blocked: boolean;
  }>(
    `with settings as (
       select coalesce((
         select value::int
         from app_settings
         where key = 'max_absences_before_block'
       ), 4) as absence_limit
     )
     select
       u.id,
       u.name,
       u.email,
       u.status,
       pp.cedula,
       pp.phone,
       pp.absence_unlocked_at::text,
       absences.absence_count,
       settings.absence_limit,
       (absences.absence_count > settings.absence_limit) as registration_blocked
     from users u
     left join person_profiles pp on pp.user_id = u.id
     cross join settings
     left join lateral (
       select count(*)::int as absence_count
       from shift_registrations sr
       where sr.person_id = u.id
         and sr.status = 'CONFIRMED'
         and sr.attendance_status = 'ABSENT'
         and sr.updated_at > coalesce(pp.absence_unlocked_at, '-infinity'::timestamptz)
     ) absences on true
     where u.role = 'PERSON'
       and absences.absence_count > settings.absence_limit
     order by absences.absence_count desc, u.name asc`,
  );

  return result.rows;
}

export async function getAuditLogs() {
  const result = await query<{
    id: string;
    actor_name: string | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>(
    `select
       al.id,
       u.name as actor_name,
       u.email as actor_email,
       al.action,
       al.entity_type,
       al.entity_id,
       al.metadata,
       al.created_at::text
     from audit_logs al
     left join users u on u.id = al.actor_user_id
     order by al.created_at desc
     limit 200`,
  );

  return result.rows;
}

export async function getCalendarShifts(view: string) {
  let condition = `s.shift_date >= ${COLOMBIA_TODAY_SQL} - interval '7 days'`;

  if (view === "day") {
    condition = `s.shift_date = ${COLOMBIA_TODAY_SQL}`;
  }

  if (view === "week") {
    condition = `s.shift_date between ${COLOMBIA_TODAY_SQL} and ${COLOMBIA_TODAY_SQL} + interval '7 days'`;
  }

  if (view === "month") {
    condition = `date_trunc('month', s.shift_date) = date_trunc('month', ${COLOMBIA_TODAY_SQL})`;
  }

  const result = await query<
    ShiftSummary & {
      day_key: string;
    }
  >(
    `select
       s.id,
       s.name,
       s.description,
       s.shift_date::text,
       s.shift_date::text as day_key,
       s.start_time::text,
       s.end_time::text,
       s.max_capacity,
       s.status,
       s.created_at::text,
       s.created_by,
       u.name as created_by_name,
       count(sr.id) filter (where sr.status = 'CONFIRMED')::int as registered_count,
       greatest(s.max_capacity - count(sr.id) filter (where sr.status = 'CONFIRMED'), 0)::int as available_count
     from shifts s
     left join users u on u.id = s.created_by
     left join shift_registrations sr on sr.shift_id = s.id
     where ${condition}
     group by s.id, u.name
     order by s.shift_date asc, s.start_time asc`,
  );

  return result.rows;
}
