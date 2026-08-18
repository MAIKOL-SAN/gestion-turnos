import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  AttendanceBadge,
  EmptyState,
  PageHeader,
  RegistrationBadge,
  StatusBadge,
  linkClass,
  tableClass,
  tableShellClass,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function MyShiftsPage() {
  const user = await requireUser();
  const registrations = await getUserRegistrations(user.id);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Mis turnos"
        description="Historial de inscripciones y estado de asistencia."
      />
      {registrations.length === 0 ? (
        <EmptyState>Aun no tienes inscripciones.</EmptyState>
      ) : (
        <div className={tableShellClass}>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Fecha</th>
                  <th>Inscripcion</th>
                  <th>Asistencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.registration_id}>
                    <td>
                      <Link className={linkClass} href={`/shifts/${registration.id}`}>
                        {registration.name}
                      </Link>
                    </td>
                    <td>
                      {formatDate(registration.shift_date)} -{" "}
                      {formatTime(registration.start_time)} a{" "}
                      {formatTime(registration.end_time)}
                    </td>
                    <td>
                      <RegistrationBadge
                        status={registration.registration_status as "CONFIRMED" | "CANCELLED"}
                      />
                    </td>
                    <td>
                      <AttendanceBadge status={registration.attendance_status} />
                    </td>
                    <td>
                      <StatusBadge status={registration.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
