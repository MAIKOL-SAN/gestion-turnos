import Link from "next/link";
import { ArrowRight, Clock3, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getShiftSummaries } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function ShiftsPage() {
  const user = await requireUser();
  const shifts = await getShiftSummaries({
    personId: user.id,
    onlyOpenFuture: true,
  });

  return (
    <AppShell user={user}>
      <PageHeader
        title="Turnos disponibles"
        description="Consulta horarios abiertos y cupos antes de confirmar tu inscripcion."
      />
      {shifts.length === 0 ? (
        <EmptyState>No hay turnos abiertos por ahora.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shifts.map((shift) => {
            const usedPercent = Math.min(
              100,
              Math.round((shift.registered_count / shift.max_capacity) * 100),
            );

            return (
              <Link key={shift.id} href={`/shifts/${shift.id}`} className="app-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {shift.name}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <Clock3 aria-hidden size={16} />
                      <span>
                        {formatDate(shift.shift_date)} - {formatTime(shift.start_time)} a{" "}
                        {formatTime(shift.end_time)}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={shift.status} />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                      <UsersRound aria-hidden size={16} />
                      {shift.registered_count} / {shift.max_capacity}
                    </span>
                    <span className="text-[var(--foreground-muted)]">
                      {shift.status === "FULL"
                        ? "Cupo completo"
                        : `${shift.available_count} disponibles`}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand-accent)]"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end text-sm font-semibold text-[var(--brand-header)] dark:text-[var(--brand-accent)]">
                  Ver turno <ArrowRight aria-hidden className="ml-2" size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
