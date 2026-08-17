import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ButtonLink, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { canTakeAttendance, requireUser } from "@/lib/auth";
import { getShiftSummaries, getUserRegistrations } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (canTakeAttendance(user.role)) {
    redirect("/attendance");
  }

  const [registrations, availableShifts] = await Promise.all([
    getUserRegistrations(user.id),
    getShiftSummaries({ personId: user.id, onlyOpenFuture: true, limit: 5 }),
  ]);

  const upcoming = registrations
    .filter(
      (registration) =>
        registration.registration_status === "CONFIRMED" &&
        registration.shift_date >= new Date().toISOString().slice(0, 10),
    )
    .slice(0, 5);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Panel"
        description="Tus proximos turnos y las opciones disponibles para inscribirte."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Proximos turnos</h2>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {upcoming.length === 0 ? (
              <EmptyState>No tienes turnos confirmados proximamente.</EmptyState>
            ) : (
              upcoming.map((shift) => (
                <Link
                  key={shift.registration_id}
                  href={`/shifts/${shift.id}`}
                  className="flex flex-col gap-2 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-950">{shift.name}</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(shift.shift_date)} · {formatTime(shift.start_time)} -{" "}
                      {formatTime(shift.end_time)}
                    </p>
                  </div>
                  <StatusBadge status={shift.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Turnos disponibles</h2>
            <ButtonLink href="/shifts" variant="secondary">
              Ver todos
            </ButtonLink>
          </div>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {availableShifts.length === 0 ? (
              <EmptyState>No hay turnos disponibles.</EmptyState>
            ) : (
              availableShifts.map((shift) => (
                <Link
                  key={shift.id}
                  href={`/shifts/${shift.id}`}
                  className="flex flex-col gap-2 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-950">{shift.name}</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(shift.shift_date)} · {shift.registered_count} /{" "}
                      {shift.max_capacity}
                    </p>
                  </div>
                  <StatusBadge status={shift.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
