import { notFound } from "next/navigation";
import { unlockPersonAttendanceAction } from "@/app/actions/attendance";
import {
  cancelRegistrationAction,
  changeShiftStatusAction,
  updateAttendanceAction,
} from "@/app/actions/shifts";
import { AppShell } from "@/components/AppShell";
import { ShiftForm } from "@/components/forms/ShiftForm";
import {
  AttendanceBadge,
  EmptyState,
  PageHeader,
  RegistrationBadge,
  StatusBadge,
  SubmitButton,
  inputClass,
  mutedClass,
  sectionTitleClass,
  tableClass,
  tableShellClass,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getShiftByIdDirect, getShiftRegistrations } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function AdminShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
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
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="app-card">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className={mutedClass}>Fecha</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {formatDate(shift.shift_date)}
              </dd>
            </div>
            <div>
              <dt className={mutedClass}>Horario</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </dd>
            </div>
            <div>
              <dt className={mutedClass}>Cupo</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {shift.registered_count} / {shift.max_capacity}
              </dd>
            </div>
          </dl>
        </div>
        <div className="app-card">
          <form action={changeShiftStatusAction} className="flex flex-col gap-3">
            <input type="hidden" name="shiftId" value={shift.id} />
            <select className={inputClass} name="status" defaultValue={shift.status}>
              <option value="DRAFT">Borrador</option>
              <option value="OPEN">Abrir inscripciones</option>
              <option value="CLOSED">Cerrar inscripciones</option>
              <option value="CANCELLED">Cancelar turno</option>
              <option value="COMPLETED">Completar turno</option>
            </select>
            <SubmitButton>Actualizar estado</SubmitButton>
          </form>
        </div>
      </section>

      <section className="app-card">
        <h2 className={sectionTitleClass}>Editar turno</h2>
        <div className="mt-4">
          <ShiftForm shift={shift} />
        </div>
      </section>

      <section className={tableShellClass}>
        <div className="border-b border-[color:var(--border)] px-4 py-3">
          <h2 className={sectionTitleClass}>Inscritos</h2>
        </div>
        {registrations.length === 0 ? (
          <div className="p-4">
            <EmptyState>No hay personas inscritas.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Cedula</th>
                  <th>Inscripcion</th>
                  <th>Asistencia</th>
                  <th>Faltas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id}>
                    <td>
                      <p className="font-semibold text-[var(--foreground)]">
                        {registration.person_name}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {registration.email}
                      </p>
                    </td>
                    <td>{registration.cedula ?? "-"}</td>
                    <td>
                      <RegistrationBadge status={registration.status} />
                    </td>
                    <td>
                      <div className="flex min-w-64 flex-col gap-2">
                        <AttendanceBadge status={registration.attendance_status} />
                        <form action={updateAttendanceAction} className="flex gap-2">
                          <input type="hidden" name="registrationId" value={registration.id} />
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <input type="hidden" name="returnTo" value={`/admin/shifts/${shift.id}`} />
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
                    <td>
                      <span
                        className={
                          registration.registration_blocked
                            ? "font-semibold text-rose-700 dark:text-rose-300"
                            : undefined
                        }
                      >
                        {registration.absence_count} / {registration.absence_limit}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {registration.registration_blocked ? (
                          <form action={unlockPersonAttendanceAction}>
                            <input type="hidden" name="personId" value={registration.person_id} />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={`/admin/shifts/${shift.id}`}
                            />
                            <SubmitButton variant="secondary">Reactivar</SubmitButton>
                          </form>
                        ) : null}
                        {registration.status === "CONFIRMED" ? (
                          <form action={cancelRegistrationAction}>
                            <input type="hidden" name="registrationId" value={registration.id} />
                            <input type="hidden" name="shiftId" value={shift.id} />
                            <SubmitButton variant="danger">Cancelar</SubmitButton>
                          </form>
                        ) : (
                          <span className={`text-sm ${mutedClass}`}>Sin accion</span>
                        )}
                      </div>
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
