import { notFound } from "next/navigation";
import { unlockPersonAttendanceAction } from "@/app/actions/attendance";
import { updateAttendanceAction } from "@/app/actions/shifts";
import { AppShell } from "@/components/AppShell";
import {
  AttendanceBadge,
  EmptyState,
  PageHeader,
  RegistrationBadge,
  StatusBadge,
  SubmitButton,
  inputClass,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getShiftByIdDirect, getShiftRegistrations } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function AttendanceShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "ATTENDANCE_MANAGER"]);
  const { id } = await params;
  const [shift, registrations] = await Promise.all([
    getShiftByIdDirect(id),
    getShiftRegistrations(id),
  ]);

  if (!shift) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <PageHeader title={shift.name} action={<StatusBadge status={shift.status} />} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-slate-500">Fecha</dt>
            <dd className="mt-1 text-slate-950">{formatDate(shift.shift_date)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Horario</dt>
            <dd className="mt-1 text-slate-950">
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Inscritos</dt>
            <dd className="mt-1 text-slate-950">
              {shift.registered_count} / {shift.max_capacity}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Lista de asistencia</h2>
        {registrations.length === 0 ? (
          <div className="mt-4">
            <EmptyState>No hay personas inscritas.</EmptyState>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Persona</th>
                  <th className="px-4 py-3">Cedula</th>
                  <th className="px-4 py-3">Inscripcion</th>
                  <th className="px-4 py-3">Asistencia</th>
                  <th className="px-4 py-3">Faltas</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((registration) => (
                  <tr key={registration.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">{registration.person_name}</p>
                      <p className="text-xs text-slate-500">{registration.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{registration.cedula ?? "-"}</td>
                    <td className="px-4 py-3">
                      <RegistrationBadge status={registration.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <AttendanceBadge status={registration.attendance_status} />
                        <form action={updateAttendanceAction} className="flex gap-2">
                          <input type="hidden" name="registrationId" value={registration.id} />
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={`/attendance/shifts/${shift.id}`}
                          />
                          <select
                            className={inputClass}
                            name="attendance"
                            defaultValue={registration.attendance_status}
                          >
                            <option value="PENDING">Pendiente</option>
                            <option value="PRESENT">Presente</option>
                            <option value="ABSENT">Ausente</option>
                            <option value="LATE">Tarde</option>
                          </select>
                          <SubmitButton variant="secondary">Guardar</SubmitButton>
                        </form>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span
                        className={
                          registration.registration_blocked
                            ? "font-semibold text-rose-700"
                            : undefined
                        }
                      >
                        {registration.absence_count} / {registration.absence_limit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {registration.registration_blocked ? (
                        <form action={unlockPersonAttendanceAction}>
                          <input type="hidden" name="personId" value={registration.person_id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={`/attendance/shifts/${shift.id}`}
                          />
                          <SubmitButton variant="secondary">Reactivar</SubmitButton>
                        </form>
                      ) : (
                        <span className="text-sm text-slate-500">Sin bloqueo</span>
                      )}
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
