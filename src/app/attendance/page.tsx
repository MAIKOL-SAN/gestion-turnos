import Link from "next/link";
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Regla de faltas</h2>
            <p className="mt-1 text-sm text-slate-600">
              El bloqueo se activa cuando la persona supera {absenceLimit} faltas.
            </p>
          </div>
          {canEditLimit ? (
            <form action={updateAbsenceLimitAction} className="flex w-full gap-2 sm:w-auto">
              <input
                className={inputClass}
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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-950">Turnos para lista</h2>
        </div>
        {shifts.length === 0 ? (
          <div className="p-4">
            <EmptyState>No hay turnos para pasar lista.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Personas</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-teal-700"
                        href={`/attendance/shifts/${shift.id}`}
                      >
                        {shift.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(shift.shift_date)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {shift.registered_count} / {shift.max_capacity}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={shift.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-950">Personas bloqueadas</h2>
        </div>
        {blockedPeople.length === 0 ? (
          <div className="p-4">
            <EmptyState>No hay personas bloqueadas por faltas.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Persona</th>
                  <th className="px-4 py-3">Cedula</th>
                  <th className="px-4 py-3">Faltas</th>
                  <th className="px-4 py-3">Gestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockedPeople.map((person) => (
                  <tr key={person.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">{person.name}</p>
                      <p className="text-xs text-slate-500">{person.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{person.cedula ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {person.absence_count} / {person.absence_limit}
                    </td>
                    <td className="px-4 py-3">
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
