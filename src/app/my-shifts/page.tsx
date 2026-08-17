import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  AttendanceBadge,
  EmptyState,
  PageHeader,
  RegistrationBadge,
  StatusBadge,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function MyShiftsPage() {
  const user = await requireUser();
  const registrations = await getUserRegistrations(user.id);

  return (
    <AppShell user={user}>
      <PageHeader title="Mis turnos" />
      {registrations.length === 0 ? (
        <EmptyState>Aun no tienes inscripciones.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Inscripcion</th>
                  <th className="px-4 py-3">Asistencia</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((registration) => (
                  <tr key={registration.registration_id}>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-teal-700" href={`/shifts/${registration.id}`}>
                        {registration.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(registration.shift_date)} ·{" "}
                      {formatTime(registration.start_time)} -{" "}
                      {formatTime(registration.end_time)}
                    </td>
                    <td className="px-4 py-3">
                      <RegistrationBadge
                        status={registration.registration_status as "CONFIRMED" | "CANCELLED"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={registration.attendance_status} />
                    </td>
                    <td className="px-4 py-3">
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
