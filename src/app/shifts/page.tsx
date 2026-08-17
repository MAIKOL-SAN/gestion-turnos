import Link from "next/link";
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
      <PageHeader title="Turnos disponibles" />
      {shifts.length === 0 ? (
        <EmptyState>No hay turnos abiertos por ahora.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {shifts.map((shift) => (
            <Link
              key={shift.id}
              href={`/shifts/${shift.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{shift.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(shift.shift_date)} · {formatTime(shift.start_time)} -{" "}
                    {formatTime(shift.end_time)}
                  </p>
                </div>
                <StatusBadge status={shift.status} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-800">
                {shift.registered_count} / {shift.max_capacity}
              </p>
              <p className="text-sm text-slate-600">
                {shift.status === "FULL"
                  ? "CUPO COMPLETO"
                  : `${shift.available_count} cupos disponibles`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
