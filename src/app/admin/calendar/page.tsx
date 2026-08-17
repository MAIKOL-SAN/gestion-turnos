import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge } from "@/components/ui";
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
      <PageHeader title="Calendario" />
      <div className="flex flex-wrap gap-2">
        {[
          ["day", "Dia"],
          ["week", "Semana"],
          ["month", "Mes"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/calendar?view=${key}`}
            className={
              view === key
                ? "rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
                : "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            }
          >
            {label}
          </Link>
        ))}
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.keys(groups).length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No hay turnos para esta vista.
          </div>
        ) : (
          Object.entries(groups).map(([day, dayShifts]) => (
            <div key={day} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-950">{formatDate(day)}</h2>
              <div className="mt-3 flex flex-col divide-y divide-slate-100">
                {dayShifts.map((shift) => (
                  <Link
                    key={shift.id}
                    href={`/admin/shifts/${shift.id}`}
                    className="py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{shift.name}</p>
                        <p className="text-sm text-slate-600">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
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
