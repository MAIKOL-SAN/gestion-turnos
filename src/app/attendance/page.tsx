import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  unlockPersonAttendanceAction,
  updateAbsenceLimitAction,
} from "@/app/actions/attendance";
import { AppShell } from "@/components/AppShell";
import {
  Alert,
  EmptyState,
  PageHeader,
  StatusBadge,
  SubmitButton,
  inputClass,
  linkClass,
  sectionTitleClass,
  tableClass,
  tableShellClass,
} from "@/components/ui";
import { isAdminRole, requireRole } from "@/lib/auth";
import { getAttendanceLimit, getAttendanceShifts, getBlockedPeople } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "ATTENDANCE_MANAGER"]);
  const params = await searchParams;
  const [absenceLimit, shifts, blockedPeople] = await Promise.all([
    getAttendanceLimit(),
    getAttendanceShifts(),
    getBlockedPeople(),
  ]);
  const canEditLimit = isAdminRole(user.role);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Pasar lista"
        description="Marca asistencia, revisa faltas y reactiva personas bloqueadas."
      />

      {params.updated === "limit" ? (
        <Alert type="success">Limite de faltas actualizado.</Alert>
      ) : null}
      {params.updated === "unlock" ? (
        <Alert type="success">Persona reactivada para nuevas inscripciones.</Alert>
      ) : null}
      {params.error === "limit" ? (
        <Alert type="error">El limite debe ser un numero entero entre 0 y 100.</Alert>
      ) : null}

      <section className="app-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-[color:var(--brand-accent)] bg-[color:color-mix(in_srgb,var(--brand-accent)_12%,var(--surface))] text-[var(--brand-header)] dark:text-[var(--brand-accent)]">
              <ShieldAlert aria-hidden size={20} />
            </div>
            <div>
              <h2 className={sectionTitleClass}>Regla de faltas</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                El bloqueo se activa cuando la persona supera {absenceLimit} faltas.
              </p>
            </div>
          </div>
          {canEditLimit ? (
            <form action={updateAbsenceLimitAction} className="flex w-full gap-2 sm:w-auto">
              <input
                className={`${inputClass} max-w-28`}
                defaultValue={absenceLimit}
                min={0}
                max={100}
                name="absenceLimit"
                type="number"
              />
              <SubmitButton variant="secondary">Guardar</SubmitButton>
            </form>
          ) : null}
        </div>
      </section>

      <section className={tableShellClass}>
        <div className="border-b border-[color:var(--border)] px-4 py-3">
          <h2 className={sectionTitleClass}>Turnos para lista</h2>
        </div>
        {shifts.length === 0 ? (
          <div className="p-4">
            <EmptyState>No hay turnos para pasar lista.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Personas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      <Link className={linkClass} href={`/attendance/shifts/${shift.id}`}>
                        {shift.name}
                      </Link>
                    </td>
                    <td>{formatDate(shift.shift_date)}</td>
                    <td>
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </td>
                    <td>
                      {shift.registered_count} / {shift.max_capacity}
                    </td>
                    <td>
                      <StatusBadge status={shift.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={tableShellClass}>
        <div className="border-b border-[color:var(--border)] px-4 py-3">
          <h2 className={sectionTitleClass}>Personas bloqueadas</h2>
        </div>
        {blockedPeople.length === 0 ? (
          <div className="p-4">
            <EmptyState>No hay personas bloqueadas por faltas.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Cedula</th>
                  <th>Faltas</th>
                  <th>Gestion</th>
                </tr>
              </thead>
              <tbody>
                {blockedPeople.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <p className="font-semibold text-[var(--foreground)]">{person.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{person.email}</p>
                    </td>
                    <td>{person.cedula ?? "-"}</td>
                    <td>
                      {person.absence_count} / {person.absence_limit}
                    </td>
                    <td>
                      <form action={unlockPersonAttendanceAction}>
                        <input type="hidden" name="personId" value={person.id} />
                        <input type="hidden" name="returnTo" value="/attendance" />
                        <SubmitButton variant="secondary">Reactivar</SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
