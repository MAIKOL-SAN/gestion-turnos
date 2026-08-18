import Link from "next/link";
import { Ban, CalendarDays, CheckCircle2, CircleAlert, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Metric, PageHeader, StatusBadge, sectionTitleClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAdminMetrics, getShiftSummaries } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function AdminDashboardPage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const [metrics, shifts] = await Promise.all([
    getAdminMetrics(),
    getShiftSummaries({ date: new Date().toISOString().slice(0, 10) }),
  ]);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Panel administrativo"
        description="Resumen operativo de registros, cupos y turnos del dia."
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          icon={<UsersRound aria-hidden size={20} />}
          label="Personas registradas"
          value={metrics.people_count}
        />
        <Metric
          icon={<CalendarDays aria-hidden size={20} />}
          label="Turnos hoy"
          tone="accent"
          value={metrics.today_count}
        />
        <Metric
          icon={<CheckCircle2 aria-hidden size={20} />}
          label="Disponibles"
          tone="success"
          value={metrics.open_count}
        />
        <Metric
          icon={<CircleAlert aria-hidden size={20} />}
          label="Completos"
          tone="warning"
          value={metrics.full_count}
        />
        <Metric
          icon={<Ban aria-hidden size={20} />}
          label="Cancelados"
          tone="danger"
          value={metrics.cancelled_count}
        />
      </section>
      <section className="app-card">
        <h2 className={sectionTitleClass}>Turnos de hoy</h2>
        <div className="mt-3 flex flex-col gap-2">
          {shifts.length === 0 ? (
            <EmptyState>No hay turnos para hoy.</EmptyState>
          ) : (
            shifts.map((shift) => (
              <Link
                key={shift.id}
                href={`/admin/shifts/${shift.id}`}
                className="rounded-md border border-transparent px-3 py-3 hover:border-[color:var(--border)] hover:bg-[var(--surface-soft)] sm:flex sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--foreground)]">{shift.name}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {formatDate(shift.shift_date)} - {formatTime(shift.start_time)} a{" "}
                    {formatTime(shift.end_time)} - {shift.registered_count} / {shift.max_capacity}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <StatusBadge status={shift.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
