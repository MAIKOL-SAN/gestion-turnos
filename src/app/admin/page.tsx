import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Metric, PageHeader, StatusBadge } from "@/components/ui";
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
      <PageHeader title="Panel administrativo" />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Personas registradas" value={metrics.people_count} />
        <Metric label="Turnos hoy" value={metrics.today_count} />
        <Metric label="Disponibles" value={metrics.open_count} />
        <Metric label="Completos" value={metrics.full_count} />
        <Metric label="Cancelados" value={metrics.cancelled_count} />
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Turnos de hoy</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {shifts.length === 0 ? (
            <p className="py-4 text-sm text-slate-600">No hay turnos para hoy.</p>
          ) : (
            shifts.map((shift) => (
              <Link
                key={shift.id}
                href={`/admin/shifts/${shift.id}`}
                className="flex flex-col gap-2 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-950">{shift.name}</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(shift.shift_date)} · {formatTime(shift.start_time)} -{" "}
                    {formatTime(shift.end_time)} · {shift.registered_count} /{" "}
                    {shift.max_capacity}
                  </p>
                </div>
                <StatusBadge status={shift.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
