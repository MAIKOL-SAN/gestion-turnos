import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ButtonLink, PageHeader, StatusBadge, sectionTitleClass } from "@/components/ui";
import { canTakeAttendance, requireUser } from "@/lib/auth";
import { getShiftSummaries, getUserRegistrations } from "@/lib/data";
import { formatDate, formatTime, isShiftUpcoming } from "@/lib/format";

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
        isShiftUpcoming(registration.shift_date, registration.start_time),
    )
    .slice(0, 5);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Panel"
        description="Tus proximos turnos y las opciones disponibles para inscribirte."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="app-card">
          <h2 className={sectionTitleClass}>Proximos turnos</h2>
          <div className="mt-4 flex flex-col gap-2">
            {upcoming.length === 0 ? (
              <p className="rounded-md bg-[var(--surface-soft)] px-3 py-4 text-sm text-[var(--foreground-muted)]">
                No tienes turnos confirmados proximamente.
              </p>
            ) : (
              upcoming.map((shift) => (
                <Link
                  key={shift.registration_id}
                  href={`/shifts/${shift.id}`}
                  className="rounded-md border border-transparent px-3 py-3 hover:border-[color:var(--border)] hover:bg-[var(--surface-soft)] sm:flex sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{shift.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <CalendarDays aria-hidden size={15} />
                      {formatDate(shift.shift_date)} - {formatTime(shift.start_time)} a{" "}
                      {formatTime(shift.end_time)}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <StatusBadge status={shift.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="app-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className={sectionTitleClass}>Turnos disponibles</h2>
            <ButtonLink href="/shifts" icon={<ArrowRight aria-hidden size={16} />} variant="secondary">
              Ver todos
            </ButtonLink>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {availableShifts.length === 0 ? (
              <p className="rounded-md bg-[var(--surface-soft)] px-3 py-4 text-sm text-[var(--foreground-muted)]">
                No hay turnos disponibles.
              </p>
            ) : (
              availableShifts.map((shift) => (
                <Link
                  key={shift.id}
                  href={`/shifts/${shift.id}`}
                  className="rounded-md border border-transparent px-3 py-3 hover:border-[color:var(--border)] hover:bg-[var(--surface-soft)] sm:flex sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{shift.name}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {formatDate(shift.shift_date)} - {shift.registered_count} /{" "}
                      {shift.max_capacity}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <StatusBadge status={shift.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
