import Link from "next/link";
import { CalendarDays, Clock3, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getCalendarShifts } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const view = ["day", "week", "month"].includes(params.view ?? "")
    ? params.view ?? "week"
    : "week";
  const shifts = await getCalendarShifts(view);
  const groups = shifts.reduce<Record<string, typeof shifts>>((acc, shift) => {
    acc[shift.day_key] = acc[shift.day_key] ?? [];
    acc[shift.day_key].push(shift);
    return acc;
  }, {});

  return (
    <AppShell user={user}>
      <PageHeader
        title="Calendario"
        description="Vista rapida por dia, semana o mes para revisar la agenda de turnos."
      />
      <div className="app-segment">
        {[
          ["day", "Dia"],
          ["week", "Semana"],
          ["month", "Mes"],
        ].map(([key, label]) => (
          <Link key={key} data-active={view === key} href={`/admin/calendar?view=${key}`}>
            {label}
          </Link>
        ))}
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.keys(groups).length === 0 ? (
          <EmptyState>No hay turnos para esta vista.</EmptyState>
        ) : (
          Object.entries(groups).map(([day, dayShifts]) => (
            <div key={day} className="app-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <CalendarDays aria-hidden size={18} />
                  {formatDate(day)}
                </h2>
                <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                  {dayShifts.length} turnos
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {dayShifts.map((shift) => (
                  <Link
                    key={shift.id}
                    href={`/admin/shifts/${shift.id}`}
                    className="rounded-md border border-[color:var(--border)] bg-[var(--surface-raised)] p-3 hover:border-[color:var(--brand-accent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--foreground)]">{shift.name}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                          <Clock3 aria-hidden size={15} />
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                          <UsersRound aria-hidden size={15} />
                          {shift.registered_count} / {shift.max_capacity}
                        </p>
                      </div>
                      <StatusBadge status={shift.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </AppShell>
  );
}
